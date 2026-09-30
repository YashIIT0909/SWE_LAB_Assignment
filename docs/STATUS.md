# Project Status (Phase 0 orientation)

Written 30 Sep 2026 after reading the whole repo and running it locally (Node 22.22, PostgreSQL 16).
"Verified" means I ran it. "Claimed" means a doc says so and I did not check it.

## 1. Verdict in one paragraph

The app works. On a fresh local database, migrate + seed succeed, lint/format/typecheck pass,
all 60 unit + integration tests pass (97.8 % line coverage), all 9 Playwright E2E tests pass,
and every main flow (register, login, browse, search, use, create/edit/delete component, keywords,
categories, reports, purge, audit) behaves as specified when called with curl. Nothing is mocked:
every screen reads from the real API and database. The problems are small: one setup bug, a few
security shortcuts, and docs (SRS/UML) that do not fully match the code or the assignment format.

## 2. Tech stack (from `package.json` files)

| Layer | Technology | Why it is there |
|---|---|---|
| Monorepo | npm workspaces (`apps/*`, `packages/*`) | api, web and shared code in one repo, one `npm install` |
| Runtime | Node.js 22 LTS | required by Prisma 7 and Vitest 4 |
| Backend | Express 5, TypeScript | HTTP API; Express 5 forwards errors from `async` handlers to the error middleware automatically |
| Validation | zod 4 (in `packages/shared`) | one schema validates the request on the server and the form on the client |
| Database | PostgreSQL | relational data, recursive queries for the category tree |
| ORM | Prisma 7 with `@prisma/adapter-pg` | typed DB access, migrations, seed |
| Auth | JWT (`jsonwebtoken`, HS256, 1 day) + `bcryptjs` (cost 10) | stateless login tokens, hashed passwords |
| Frontend | Next.js 16 (App Router), React 19, Tailwind 4, shadcn/ui (Base UI) | pages and UI components |
| Data fetching | TanStack Query 5 | caching, loading/error states, refetch after mutations |
| Tests | Vitest + Supertest (api), Vitest (shared), Playwright + axe (web E2E) | unit, integration, system tests |
| Quality | ESLint 9, Prettier 3, TS `strict`, GitHub Actions CI | same checks on every push |
| Deploy (not our focus) | Vercel (web + api as serverless function), Supabase Postgres | set up by teammates; Dinesh deploys later |

## 3. Folder structure

```
apps/api/
  src/
    index.ts            starts the server on PORT (local)
    serverless.ts       exports the same app as a Vercel handler
    app.ts              builds the Express app: CORS, JSON body, authenticate, routers, error handler
    routes/             one router per resource; attaches role middleware per endpoint
    controllers/        parse input with zod, call a service, send JSON
    services/           ALL business logic and ALL database access (only place importing prisma)
    middleware/         auth.ts, rateLimit.ts, errorHandler.ts
    lib/prisma.ts       the single PrismaClient
    errors.ts           AppError(code, status, message)
    generated/prisma/   Prisma client generated at install (gitignored)
  prisma/               schema.prisma, migrations/, seed.ts, seed-data.ts
  prisma.config.ts      tells Prisma where the schema is and which DB URL to use (DIRECT_URL)
  test/                 integration tests (*.int.test.ts), perf/ benchmark, globalSetup.ts
  build.js, api/index.js, vercel.json   serverless bundle for Vercel
apps/web/
  app/                  pages (App Router: folder = URL)
    page.tsx            home (hero, quick search, live API/DB health pill)
    browse/[[...id]]/   category tree + components in a category
    search/             keyword search with filters and Use buttons
    components/[id]/    component detail + Use button
    login/, register/   auth forms
    console/            cataloguer area: reports, categories, notations, components (list/new/edit), purge, audit
  components/           React components (forms, cards, tree, nav, ui/ = shadcn primitives)
  lib/api.ts            fetch wrapper: base URL, Bearer token, error -> ApiError
  lib/auth.tsx          AuthProvider: token in localStorage, /auth/me, signIn/signOut
  lib/queries.ts        TanStack Query hooks (useCategoryTree, useComponent, ...)
  lib/validate.ts       parseOrThrow: runs a shared zod schema before sending
  e2e/                  Playwright specs T-41, T-42, T-43, T-45
packages/shared/src/    schemas.ts (zod), constants.ts (types, error codes, audit actions, slugify)
docs/                   SRS, use cases, DFDs, design (ER/class/sequence), API, test plan, plan, report
```

## 4. Architecture

**Client-server + 3-tier + layered backend.**

```
Browser (Next.js pages, React)                         presentation tier
   |  fetch() JSON over HTTP, Authorization: Bearer <JWT>
   v
Express API  /api/v1                                   application tier
   app.ts:  cors -> express.json -> authenticate (sets req.user if token valid)
   routes/      -> requireLogin / requireCataloguer (role check)
   controllers/ -> zod .parse(req.body/query)          (bad input -> ZodError)
   services/    -> business rules + prisma calls, transactions, audit rows
   errorHandler -> maps AppError / ZodError to {"error":{code,message,details}}
   v
PostgreSQL via Prisma                                  data tier
```

SE concepts visible here: **separation of concerns** (each layer one job), **high cohesion / low
coupling** (only services know the DB; controllers never contain rules), **DRY** (shared zod schemas
used by both web and api), **defence in depth** (UI hides cataloguer pages via `RequireRole`, but the
API enforces roles itself).

## 5. Features and where they live

| Feature | Web page(s) | Route file | Controller | Service |
|---|---|---|---|---|
| Register / login / me | `app/login`, `app/register`, `components/auth-form.tsx` | `routes/auth.ts` (rate-limited) | `auth.controller.ts` | `auth.service.ts` |
| Browse category tree | `app/browse/[[...id]]`, `components/category-tree.tsx` | `routes/categories.ts` | `category.controller.ts` | `category.service.ts` (`tree`, `get`, `breadcrumb`) |
| Components in a category | same page, `components/component-list.tsx` | `routes/categories.ts` `/:id/components` | `component.controller.ts` `listInCategory` | `component.service.ts` `list` |
| Component detail | `app/components/[id]` | `routes/components.ts` | `component.controller.ts` `get` | `component.service.ts` `get` |
| Keyword search | `app/search`, `components/keyword-input.tsx` | `routes/search.ts` | `search.controller.ts` `search` | `search.service.ts` (`termScore`, `rank`, `search`) |
| Mark as used | `components/use-button.tsx` | `routes/components.ts` `/:id/use` | `search.controller.ts` `use` | `usage.service.ts` |
| Keyword autocomplete | `components/keyword-input.tsx` | `routes/keywords.ts` | `keyword.controller.ts` | `keyword.service.ts` `suggest` |
| Component CRUD + keywords | `app/console/components/*`, `components/component-form.tsx` | `routes/components.ts` | `component.controller.ts` | `component.service.ts`, `keyword.service.ts` |
| Category management | `app/console/categories` | `routes/categories.ts` | `category.controller.ts` | `category.service.ts` |
| Notations | `app/console/notations` | `routes/notations.ts` | `notation.controller.ts` | `notation.service.ts` |
| Reports dashboard | `app/console/page.tsx` | `routes/reports.ts` | `report.controller.ts` | `report.service.ts` `summary` |
| Purge | `app/console/purge` | `routes/reports.ts` | `report.controller.ts` | `report.service.ts` `purgeCandidates`, `purge` |
| Audit log | `app/console/audit` | `routes/reports.ts` | `report.controller.ts` | `report.service.ts` `auditLog`, `audit.service.ts` |
| Health | home page pill | `routes/health.ts` | (inline) | `health.service.ts` |

## 6. Data model (`apps/api/prisma/schema.prisma`)

| Model | Purpose | Key relationships |
|---|---|---|
| `User` | account; `role` = `CATALOGUER` or `USER` | creates Components; owns SearchQueries, UsageEvents, AuditLogs |
| `Category` | tree node | self-relation `parentId` -> parent; `@@unique([parentId, name])` |
| `Notation` | UML, ERD, Java, ... with `kind` DESIGN/CODE | 1 notation -> many components |
| `Component` | the catalogue item; holds counters `useCount`, `queryHitCount`, `queryHitNotUsedCount`, `lastUsedAt` | belongs to 1 Notation, 1 Category, 1 creator |
| `Keyword` | unique lowercase term | many-to-many with Component |
| `ComponentKeyword` | join table for that many-to-many | composite PK; cascade delete with Component |
| `SearchQuery` | one row per search (terms, filters, resultCount) | has many SearchResults |
| `SearchResult` | which component appeared at which rank, and whether it was later `used` | composite PK (queryId, componentId) |
| `UsageEvent` | one row per "Use" click | links Component, optional User and SearchQuery |
| `AuditLog` | one row per cataloguer write | actor = User |

Rules enforced in services: notation kind must equal component kind (`NOTATION_KIND_MISMATCH`),
no duplicate sibling or root category names, no moving a category under its own descendant
(`CATEGORY_CYCLE`, found with a recursive SQL CTE in `descendantIds`), non-empty category delete
needs `reassignTo`.

## 7. API endpoints

27 endpoints under `/api/v1`, exactly as listed in `CLAUDE.md` (verified against `routes/*.ts`).
Access: public for reads and search, `requireLogin` for `/auth/me` and `/components/:id/use`,
`requireCataloguer` for every write and all `/reports/*`.

## 8. Request flows (browser to database and back)

### 8.1 Search
1. **UI event**: user adds keyword chips on `app/search/page.tsx` and clicks Search.
2. **Client validation**: `parseOrThrow(searchBody, ...)` (`lib/validate.ts`) runs the shared zod schema.
3. **API call**: `useMutation` -> `api('/search', {method:'POST', json})` (`lib/api.ts`). It is a
   mutation, not a query, because search changes counters.
4. **Route**: `routes/search.ts` -> `POST /` (public; `authenticate` already set `req.user` if logged in).
5. **Controller**: `search.controller.ts` `search` -> `searchBody.parse(req.body)` (trims, lowercases, de-dups terms).
6. **Service**: `search.service.ts` `search`:
   finds keywords that equal or start with the terms -> loads candidate components with their
   keywords -> `rank()` scores in memory (2 exact, 1 prefix >= 3 chars; any/all; sort score, useCount, name)
   -> slices the requested page -> **one transaction**: create `SearchQuery` + `SearchResult` rows
   for the page, `queryHitCount+1` and `queryHitNotUsedCount+1` on those components.
7. **Response**: `{queryId, items:[...component, matchedKeywords, score], page, pageSize, total}`.
8. **UI update**: result cards render; each `UseButton` receives the `queryId`.

### 8.2 Use a component
1. User clicks **Use this component** (`components/use-button.tsx`); if not logged in, a login link is shown instead.
2. `POST /components/:id/use {queryId?}` with Bearer token.
3. `routes/components.ts` -> `requireLogin` -> `search.controller.ts` `use` -> `useBody.parse`.
4. `usage.service.ts` `use` in **one transaction**: if `queryId` given, flip `SearchResult.used`
   false -> true with a conditional `updateMany` (so double clicks count once) and decrement
   `queryHitNotUsedCount` only if > 0; always `useCount+1`, `lastUsedAt=now`, insert `UsageEvent`.
5. Returns the new counters; UI shows "Marked as used (N uses in total)" and refetches the detail.
   Verified: second use with the same `queryId` returns `countedQueryHit:false`.

### 8.3 Login
1. `components/auth-form.tsx` submits -> `POST /auth/login`.
2. `routes/auth.ts` (rate limiter 20/15 min) -> `auth.controller.ts` -> `loginBody.parse`.
3. `auth.service.ts` `login`: find user by email, `bcrypt.compare`, sign JWT `{sub: userId, role}`.
4. Web: `useAuth().signIn` stores the token in `localStorage` (`sccs.token`) and in `lib/api.ts`;
   every later request carries `Authorization: Bearer ...`; `/auth/me` restores the user on reload.

### 8.4 Create component (cataloguer)
1. `app/console/components/new` -> `components/component-form.tsx` -> `POST /components`.
2. `requireCataloguer` (401 if no token, 403 if USER) -> `createComponentBody.parse`.
3. `component.service.ts` `create`: check notation kind and category exist -> **transaction**:
   create component + `connectOrCreate` keywords + `COMPONENT_CREATE` audit row.
   Verified: keywords `" Observer "`, `"EVENTS"` stored as `observer`, `events`.

### 8.5 Purge
1. `app/console/purge` -> `GET /reports/purge-candidates?maxUses&minNotUsedHits&unusedForDays&olderThanDays`.
2. `report.service.ts` `candidateWhere` builds the filter; list returned.
3. Cataloguer ticks ids -> `POST /reports/purge {componentIds, params}`.
4. `purge`: one transaction; per id, `deleteMany` with the criteria in the same statement (re-check),
   writes `COMPONENT_PURGE` audit row; returns `{deleted, skipped}`.

## 9. How to run locally (verified)

See `CLAUDE.md` "Commands". Short version:

```
cp apps/api/.env.example apps/api/.env          # must happen before npm install
cp apps/web/.env.example apps/web/.env.local
# create Postgres DBs sccs_dev and sccs_test; put the password in the URLs if needed
npm install
npm run db:deploy -w @sccs/api && npm run db:seed -w @sccs/api
npm run dev                                     # web http://localhost:3000, api http://localhost:4000/api/v1
```

Log in as the seeded cataloguer using `SEED_CATALOGUER_EMAIL` / `SEED_CATALOGUER_PASSWORD` from your
`apps/api/.env`. Register any new account to act as a USER.

## 10. Environment variables (names only)

- `apps/api/.env`: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_TEST`, `JWT_SECRET`, `WEB_ORIGIN`,
  `PORT`, `SEED_CATALOGUER_EMAIL`, `SEED_CATALOGUER_PASSWORD`
- `apps/web/.env.local`: `NEXT_PUBLIC_API_URL`

## 11. What was checked and the results

| Check | Result |
|---|---|
| `npm install` on fresh clone without `.env` | **Fails** (see 12.1) |
| migrate + seed | OK: 10 notations, 1 cataloguer, 10 categories, 14 demo components |
| lint, format:check, typecheck | OK |
| `npm test` | 60 tests pass (5 shared, 55 api incl. perf benchmark); coverage 97.8 % lines |
| Playwright E2E (9 tests) | Pass, when pointed at the running dev server and the container's Chromium |
| curl: role checks | USER creating a component -> 403 `FORBIDDEN`; anonymous use -> 401 |
| curl: validation | empty keywords -> 400 `VALIDATION_ERROR` with details |
| curl: notation kind rule | CODE component with DFD notation -> 422 `NOTATION_KIND_MISMATCH` |
| curl: search + use counters | hit counters +1 on search; use flips once, never below 0 |
| curl: reports, audit, delete | OK; audit row written for create |
| `npm run build -w @sccs/web` | Not run yet (CI claims it passes) |

## 12. Incomplete, broken, or questionable

### 12.1 Broken
- **Fresh `npm install` fails** without `apps/api/.env`: `postinstall` runs `prisma generate`, which
  loads `prisma.config.ts`, which requires `DIRECT_URL`. Workaround documented; a one-line code fix
  (fallback URL in `prisma.config.ts`, or `env` default) is a Phase 2 candidate.

### 12.2 Security shortcuts (good viva material, decide in Phase 2)
- `auth.service.ts` `secret()` falls back to a **hard-coded JWT secret** if `JWT_SECRET` is unset.
  Anyone who reads the repo could forge a cataloguer token on such a deployment. Contradicts SRS NFR-2
  ("JWT secret from env only").
- CORS in `app.ts` **accepts every origin**: the callback's final line is `callback(null, true)`, so the
  allow-list above it has no effect.
- Rate limiter is in-memory per process: resets on restart and is not shared between serverless instances.
- Token kept in `localStorage` (readable by any script on the page if XSS existed); common trade-off, fine for this scope.

### 12.3 Cosmetic / minor
- Home page "System Highlights" numbers are hard-coded text (`app/page.tsx` ~line 360), not live data.
- `RATE_LIMITED` (429) error code exists in code but is missing from CLAUDE.md's error code list.
- Purge demo gotcha: seeded components are brand new, so with the default `olderThanDays=30` the
  purge page shows **0 candidates**. Set it to 0 in the form to demo purge (verified: 14 candidates).
- `apps/api/api/index.js` is a committed build output (needed by Vercel as configured).
- No unit tests for the web app (only E2E). Enough for "testing exists", as the assignment asks.

### 12.4 Docs vs code and assignment (feeds Phases 3-4, nothing changed yet)
- **SRS** (`docs/01-SRS.md`) is full IEEE 830 (intro, interfaces, traceability). The assignment asks
  for **FR and NFR only**. FR-1..FR-27 match the code well. NFR issues: NFR-2 false (hard-coded
  secret fallback), NFR-6 (99 % availability) cannot be honestly claimed for a local demo, NFR-5
  claims more (WCAG AA, 360 px) than the axe scan proves, rate limiting is not listed.
- **Use case diagram** (`docs/02-use-cases.md`) is a Mermaid *flowchart* imitating UML (Mermaid has
  no real use case diagram). Needs PlantUML for proper actor / system boundary / include / extend
  notation. "View component details" (FR-3) has no use case.
- **Class diagram** (`docs/04-design.md` section 4) mostly matches the entities but the service part
  is wrong: `ComponentService.createNotation/listNotations` (really `notation.service.ts`),
  `KeywordService.normalise` (does not exist; normalisation is in the shared zod schema),
  `CategoryService.listComponents` (really `component.service.ts list`), `ReportService.audit`
  (really `auditLog`), and `NotationService`, `AuditService`, `HealthService` are missing. Missing
  associations: User-SearchQuery, User-UsageEvent, SearchQuery-UsageEvent. `ComponentKeyword` should
  appear as an association class. Services are modules of functions, not classes (to be shown as
  `<<service>>` classes and explained in the viva).

## 13. Top uncertainties for you to verify by running the app

1. Does every web page render and work in your browser (I tested the API with curl and the E2E
   suite, but I have not clicked through every console page by hand)?
2. Does `npm run build -w @sccs/web` succeed on your machine (not run yet here)?
3. Do you have a local Postgres, and does it need a password? `.env.example` URLs have none.
4. Is the Vercel deployment your teammates set up still live, and does it use a real `JWT_SECRET`?
   (Only matters for your own deploy later.)
5. Your draft PPT: which parts were written against older docs? (Needed for Phase 5.)
