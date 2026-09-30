# Project Plan

Ten phases (0..9). All work is committed on `main`; each phase ends with lint, typecheck and
tests green and `docs/PROGRESS.md` updated. From Phase 2 on every phase is a vertical slice:
schema -> service -> route -> web screen, so every endpoint ships with the screen that uses it.

| # | Phase | Backend (`apps/api`) | Frontend (`apps/web`) | Exit / demo | Tests |
|---|---|---|---|---|---|
| 0 | Docs | SRS, use cases, analysis, design, API, test plan, this plan | - | Docs committed | - |
| 1 | Scaffold | npm workspaces, `packages/shared`, Express `app.ts`, error handler, `AppError`, `GET /health` with DB ping, Prisma client, ESLint/Prettier/Vitest, CI | Next.js + Tailwind shell, API client, home page shows API/DB status | Web shows "API ok, DB ok" | T-01 |
| 2 | Auth + schema | Full Prisma schema + migration, seed (notations, cataloguer, demo tree), register/login/me, `authenticate`, `requireRole` | Login and register pages, token storage, `useMe`, role-aware nav, console route guard | Seeded cataloguer and a new user see different navs | T-02..T-05, T-44 |
| 3 | Categories + notations | Tree with counts, detail with breadcrumb, create/update/delete (duplicate, cycle, reassign), notations, audit rows | Category tree + browse page with breadcrumb; console category and notation managers | Browse tree; cataloguer edits it | T-14, T-15, T-28, T-29, T-31..T-33 |
| 4 | Components + keywords | Component CRUD, kind/notation check, keyword PUT/POST/DELETE, `/keywords` autocomplete, `/components` filters, `/categories/:id/components` | Component list per category, detail page, console create/edit form with keyword chips and autocomplete, delete | Cataloguer adds a UML design and a Python snippet; user browses to them | T-06..T-13, T-30, T-34, T-35, T-46 |
| 5 | Search + usage | `POST /search` (scoring, any/all, filters, counters, SearchQuery/Result), `POST /components/:id/use`; 80 % service coverage gate | Search page (chips, any/all, filters, score, matched keywords), "Use this component" with `queryId` | Search -> use moves counters as specified | T-16..T-27 |
| 6 | Reports + purge | Summary, purge candidates, purge (re-check), audit log | Console dashboard, purge screen, audit table | Cataloguer purges an unused component | T-36..T-39 |
| 7 | E2E + hardening | Auth rate limit, perf dataset script | Playwright journeys, axe scan, loading/empty/error states | E2E green locally and in CI | T-40..T-43, T-45 |
| 8 | Release | `prisma migrate deploy` in deploy, Supabase production DB, production seed | Vercel production build and env wiring | T-01..T-46 on the Vercel deployment | all |
| 9 | Report | - | - | Final report, screenshots, demo script, traceability filled | - |

## Assignment phases (Assignment 8, deadline 1 Oct 2026)

After the team's build phases above, the project was taken over and prepared for submission in
these phases (brief in `docs/ASSIGNMENT_CONTEXT.md`).

| # | Phase | Status | Where |
|---|---|---|---|
| 0 | Orientation: read the repo, verify it runs | Done | `docs/STATUS.md` |
| 1 | Walkthrough of the system (explained in chat, produces no file) | Not tracked here | - |
| 2 | Get it running and demo-able: fixes and seed data | Done, CI green | `docs/CHANGELOG_MINE.md` |
| 3 | SRS: functional and non-functional requirements from the real system | Done | `docs/01-SRS.md` |
| 4 | UML: use case and class diagrams that match the code (PlantUML) | Done | `docs/diagrams/`, `docs/02-use-cases.md`, `docs/04-design.md` |
| 5 | PPT compared with the final code, SRS and UML | Comparison done, edits pending | `docs/PPT_Modify.md` |
| 6 | Viva preparation | To do | - |

## Environments

| Env | Database | How |
|---|---|---|
| Local dev | Local Postgres `sccs_dev` | `DATABASE_URL` in `apps/api/.env` |
| Tests | Local Postgres `sccs_test` / CI service container | `DATABASE_URL_TEST` |
| Production | Supabase Postgres (pooled `DATABASE_URL`, direct `DIRECT_URL`) | Vercel env vars |
