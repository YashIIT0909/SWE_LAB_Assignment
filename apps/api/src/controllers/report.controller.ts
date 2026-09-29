import type { Request, Response } from 'express'
import { auditQuery, purgeBody, purgeCandidatesQuery } from '@sccs/shared'
import * as reports from '../services/report.service'

export const summary = async (_req: Request, res: Response) => {
  res.json(await reports.summary())
}

export const purgeCandidates = async (req: Request, res: Response) => {
  res.json(await reports.purgeCandidates(purgeCandidatesQuery.parse(req.query)))
}

export const purge = async (req: Request, res: Response) => {
  const { componentIds, params } = purgeBody.parse(req.body)
  res.json(await reports.purge(componentIds, params, req.user!.sub))
}

export const audit = async (req: Request, res: Response) => {
  res.json(await reports.auditLog(auditQuery.parse(req.query)))
}
