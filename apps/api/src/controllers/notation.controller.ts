import type { Request, Response } from 'express'
import { createNotationBody, notationQuery } from '@sccs/shared'
import * as notations from '../services/notation.service'

export const list = async (req: Request, res: Response) => {
  res.json({ items: await notations.list(notationQuery.parse(req.query).kind) })
}

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await notations.create(createNotationBody.parse(req.body), req.user!.sub))
}
