import type { Request, Response } from 'express'
import {
  addKeywordsBody,
  categoryComponentsQuery,
  createComponentBody,
  listComponentsQuery,
  putKeywordsBody,
  updateComponentBody,
} from '@sccs/shared'
import * as components from '../services/component.service'
import * as keywords from '../services/keyword.service'

type IdReq = Request<{ id: string }>

export const list = async (req: Request, res: Response) => {
  res.json(await components.list(listComponentsQuery.parse(req.query)))
}

export const listInCategory = async (req: IdReq, res: Response) => {
  const q = categoryComponentsQuery.parse(req.query)
  res.json(await components.list({ ...q, categoryId: req.params.id }))
}

export const get = async (req: IdReq, res: Response) => {
  res.json(await components.get(req.params.id))
}

export const create = async (req: Request, res: Response) => {
  res.status(201).json(await components.create(createComponentBody.parse(req.body), req.user!.sub))
}

export const update = async (req: IdReq, res: Response) => {
  res.json(
    await components.update(req.params.id, updateComponentBody.parse(req.body), req.user!.sub),
  )
}

export const remove = async (req: IdReq, res: Response) => {
  await components.remove(req.params.id, req.user!.sub)
  res.status(204).end()
}

export const putKeywords = async (req: IdReq, res: Response) => {
  const body = putKeywordsBody.parse(req.body)
  res.json(await keywords.replace(req.params.id, body.keywords, req.user!.sub))
}

export const addKeywords = async (req: IdReq, res: Response) => {
  const body = addKeywordsBody.parse(req.body)
  res.json(await keywords.add(req.params.id, body.keywords, req.user!.sub))
}

export const removeKeyword = async (
  req: Request<{ id: string; keywordId: string }>,
  res: Response,
) => {
  res.json(await keywords.remove(req.params.id, req.params.keywordId, req.user!.sub))
}
