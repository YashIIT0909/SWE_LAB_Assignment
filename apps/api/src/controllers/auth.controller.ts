import type { Request, Response } from 'express'
import { loginBody, registerBody } from '@sccs/shared'
import * as auth from '../services/auth.service'

export const register = async (req: Request, res: Response) => {
  res.status(201).json(await auth.register(registerBody.parse(req.body)))
}

export const login = async (req: Request, res: Response) => {
  res.json(await auth.login(loginBody.parse(req.body)))
}

export const me = async (req: Request, res: Response) => {
  res.json({ user: await auth.me(req.user!.sub) })
}
