# Progress

| Phase | Status | Notes |
|---|---|---|
| 0 Docs | Done | SRS, use cases, analysis, design, API, test plan, project plan |
| 1 Scaffold | Done | Workspaces, shared pkg, Express app + `/health` (T-01), Next.js shell showing API/DB status, ESLint/Prettier/Vitest, CI with Postgres service. Node 22 (20 is EOL). |
| 2 Auth + schema | Done | Full Prisma schema + init migration, idempotent seed (10 notations, cataloguer from env, demo tree), register/login/me, `authenticate`/`requireLogin`/`requireRole`, shadcn/ui, login/register pages, role-aware nav, console guard. Tests T-02..T-05, T-44. |
| 3 Categories + notations | Done | Tree with direct/total counts, detail with breadcrumb (recursive CTE), create/update/delete with duplicate, cycle and reassign rules, notations list/create, audit rows. Web: browse page with tree + breadcrumb, console category and notation managers. Tests T-14, T-15, T-28, T-29, T-31..T-33. |
| 4 Components + keywords | Done | Component CRUD with notation-kind check, keyword replace/add/remove, `/keywords` autocomplete, `/components` filters + q, `/categories/:id/components`, demo components in seed. Web: category component list (sort, subcategories, pagination), component detail, console component table and create/edit form with keyword chips + autocomplete. Tests T-06..T-13, T-27 (list), T-30, T-34, T-35, T-46 + shared schema unit tests. |
| 5 Search + usage | Done | `POST /search` (exact/prefix scoring, any/all, filters, SearchQuery + SearchResult, hit counters for the returned page only, one transaction), `POST /components/:id/use` (conditional flip of SearchResult, never-negative decrement, UsageEvent). Coverage gate: services >= 80 % lines, overall >= 70 % (currently ~99 %). Web: search page (keyword chips, any/all, filters, score, matched keywords), Use button on results and detail (carries queryId), home search box. Tests T-16..T-27. |
| 6 Reports + purge | Not started | |
| 7 E2E + hardening | Not started | |
| 8 Release | Not started | |
| 9 Report | Not started | |
