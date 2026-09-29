import type { Request, Response } from 'express'
import { searchBody, useBody } from '@sccs/shared'
import * as searchService from '../services/search.service'
import * as usage from '../services/usage.service'

export const search = async (req: Request, res: Response) => {
  res.json(await searchService.search(searchBody.parse(req.body), req.user?.sub))
}

export const use = async (req: Request<{ id: string }>, res: Response) => {
  const { queryId } = useBody.parse(req.body ?? {})
  res.json(await usage.use(req.params.id, req.user!.sub, queryId))
}
