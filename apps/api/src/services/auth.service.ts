import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { LoginBody, RegisterBody, Role } from '@sccs/shared'
import { AppError } from '../errors'
import { prisma } from '../lib/prisma'

export interface TokenPayload {
  sub: string
  role: Role
}

const secret = () => {
  return process.env.JWT_SECRET || 'sccs-default-super-secret-key-change-in-production'
}

const publicUser = { id: true, name: true, email: true, role: true, createdAt: true } as const
export const sign = (u: { id: string; role: Role }) =>
  jwt.sign({ role: u.role }, secret(), { subject: u.id, expiresIn: '1d', algorithm: 'HS256' })

export async function register(dto: RegisterBody) {
  if (await prisma.user.findUnique({ where: { email: dto.email } }))
    throw new AppError('EMAIL_TAKEN', 409, 'Email is already registered')
  const user = await prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: 'USER',
    },
    select: publicUser,
  })
  return { token: sign(user), user }
}

export async function login(dto: LoginBody) {
  const found = await prisma.user.findUnique({ where: { email: dto.email } })
  if (!found || !(await bcrypt.compare(dto.password, found.passwordHash)))
    throw new AppError('INVALID_CREDENTIALS', 401, 'Email or password is incorrect')
  const { passwordHash, ...user } = found
  return { token: sign(user), user }
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser })
  if (!user) throw new AppError('UNAUTHENTICATED', 401, 'User no longer exists')
  return user
}

/** Returns null for any missing, malformed or expired token. */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const p = jwt.verify(token, secret(), { algorithms: ['HS256'] })
    if (typeof p === 'string' || !p.sub) return null
    return { sub: p.sub, role: p.role as Role }
  } catch {
    return null
  }
}
