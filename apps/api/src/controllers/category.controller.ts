import type { Request, Response } from 'express'
import { createCategoryBody, deleteCategoryQuery, updateCategoryBody } from '@sccs/shared'
import * as categories from '../services/category.service'

type IdReq = Request<{ id: string }>

export const tree = async (_req: Request, res: Response) => {
  res.json({ items: await categories.tree() })
}

export const get = async (req: IdReq, res: Response) => {
  res.json(await categories.get(req.params.id))
}

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await categories.create(createCategoryBody.parse(req.body), req.user!.sub))
}

export const update = async (req: IdReq, res: Response) => {
  res.json(
    await categories.update(req.params.id, updateCategoryBody.parse(req.body), req.user!.sub),
  )
}

export const remove = async (req: IdReq, res: Response) => {
  const { reassignTo } = deleteCategoryQuery.parse(req.query)
  res.json(await categories.remove(req.params.id, reassignTo, req.user!.sub))
}
