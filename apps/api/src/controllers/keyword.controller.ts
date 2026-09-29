import type { Request, Response } from 'express'
import { keywordSuggestQuery } from '@sccs/shared'
import * as keywords from '../services/keyword.service'

export const suggest = async (req: Request, res: Response) => {
  const { prefix, limit } = keywordSuggestQuery.parse(req.query)
  res.json({ items: await keywords.suggest(prefix, limit) })
}
