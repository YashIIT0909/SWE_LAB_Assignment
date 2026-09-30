# CLAUDE.md — Software Component Cataloguing System

Single source of truth for every Claude Code session on this repo. Read it fully before changing
anything. If code and this file disagree, fix the code or update this file in the same PR.
Problem statement: `docs/00-problem-statement.md`. Requirements: `docs/01-SRS.md`.
Full API examples: `docs/05-api.md`. Phase status: `docs/PROGRESS.md`.
Assignment brief and working rules (read first): `docs/ASSIGNMENT_CONTEXT.md`.

## Project context

- Software Engineering course, **Assignment 8** (problem 8: Software Component Cataloguing).
- Deliverables: **SRS (functional + non-functional requirements only)**, **UML use case and class
  diagrams**, a **PPT**, and this **working website**. PPT, docs and code must match each other.
- **Deadline: 1 Oct 2026** (late submissions penalised).
- Team project built quickly with AI by teammates; Dinesh has taken over as the sole maintainer.
- Real goal: Dinesh must understand everything end to end (requirements, architecture, code, backend
  flow, diagrams) to answer the professor's viva questions. Marks come from explanation, not a rubric.
- Priorities: (1) working local demo, (2) SRS, (3) UML, (4) PPT aligned to code, (5) explainability.
  Dinesh deploys to Vercel; sessions focus on local running only.

## Working rules

1. Plan first: for any file change, show a plan and wait for approval. Never bulk-edit.
2. Teach before touching: explain each change in 3-6 lines (what, why, how it connects).
3. For every frontend piece, explain the request flow: UI event -> API call -> route -> controller ->
   service -> DB -> response -> UI update, naming real files and functions.
4. Ground claims in real code with file paths; say "I'm not sure" when guessing. Don't assume
   teammates' code works: run it.
5. Small steps: one task per commit with a readable diff; no unrelated refactors.
6. Teach-back quizzes are paused until Dinesh asks for them.
7. Name the SE concept when code illustrates one (FR/NFR, use cases, class relationships, layering,
   SDLC, testing levels) and show the example in this repo.
8. Compact, direct explanations; latest stable practices, but don't rewrite what works.
9. Never print, log or commit `.env` values; use `.env.example`.
10. Even on "just do it", give a 2-line summary of what changed and why.

## Summary

A web catalogue of potentially reusable software components. A component is either a **design**
(UML, ERD, Structured Design, DFD, ...) or **code** (Java, Python, C, ...). Components are tagged
with keywords, filed in a hierarchical category tree, found by keyword search or browsing, and
their reuse is tracked (times used, times shown in a search but not used) so cataloguers can
purge components nobody uses.

### Actors

| Actor | Can do |
|---|---|
| **Cataloguer** (`CATALOGUER`) | Add, edit, delete components; associate keywords; manage categories and notations; view reports; purge unused components. Also everything a User can do. |
| **User** (`USER`) | Browse categories, query by keywords, view a component, mark a component as used. |

- `POST /auth/register` **always** creates a `USER`. There is no API to create or promote a cataloguer.
- Cataloguer accounts are created by the Prisma seed script (credentials from env vars).
- Anonymous visitors may browse, view and search; marking a component as used requires login.

## Stack and layout

npm workspaces, Node 22 LTS (`"engines": {"node": ">=22"}`, `.nvmrc` = `22`; Node 20 is EOL and
Vitest/Prisma 7 need 22+).

```
apps/api        Express 5 + TypeScript, zod 4, Prisma 7 (@prisma/adapter-pg; PostgreSQL),
                Vitest + Supertest
  src/            app.ts (express app), index.ts (local server), serverless.ts (Vercel handler)
  prisma/         schema.prisma, migrations/, seed.ts + seed-data.ts, prisma.config.ts (reads DIRECT_URL)
  test/           *.int.test.ts integration tests, perf/ benchmark, globalSetup.ts (migrates test DB)
  build.js        esbuild bundles src/serverless.ts -> api/index.js (committed, used by vercel.json)
apps/web        Next.js 16 App Router + React 19 + TypeScript + Tailwind 4 + shadcn/ui, TanStack Query,
                Playwright (e2e only; the web app has no unit tests)
  app/            pages: /, /browse, /search, /components/[id], /login, /register, /console/*
  lib/            api.ts (fetch wrapper, adds Bearer token), auth.tsx (token in localStorage),
                  queries.ts (TanStack Query hooks)
  e2e/            Playwright specs t41..t45
packages/shared zod schemas and TS types used by both api and web (+ unit tests)
docs/           SRS, use cases, analysis, design, API, test plan, project plan, report, PROGRESS.md,
                ASSIGNMENT_CONTEXT.md
```

Deployment: both apps on Vercel (web as a Next.js project, api as an Express serverless
function), database on Supabase (used only as managed Postgres;
auth stays in the API, no supabase-js). Prisma migrations run with `prisma migrate deploy` in CI/deploy.

### Backend layering (apps/api/src)

`routes/` (Express routers, mount paths) -> `controllers/` (parse with zod, call a service, send
response) -> `services/` (all business logic, the **only** place that imports Prisma) ->
`lib/prisma.ts` (single PrismaClient). Plus `middleware/` and `errors.ts`
(`AppError(code, status, message, details?)`, `notFound()`).

- `middleware/auth.ts`: `authenticate` (global; decodes the Bearer token into `req.user` if present),
  `requireLogin`, `requireRole(role)`, `requireCataloguer`.
- `middleware/rateLimit.ts`: in-memory per-IP limiter, applied to auth routes only (20 requests per
  15 min); skipped when `NODE_ENV=test`. State is per process, so it is not shared across serverless instances.
- `middleware/errorHandler.ts`: `notFoundRoute` and `errorHandler` (maps `AppError` and zod errors to
  the error shape below).
- There is no separate validate middleware: controllers call `schema.parse(...)` on zod schemas from
  `packages/shared`, and the error handler turns failures into `VALIDATION_ERROR`.
- `app.ts` mounts the same router at `/api/v1` (canonical) and also at `/v1`, `/api` and `/` so the
  Vercel rewrite works. CORS currently allows any origin (the origin callback always accepts).

## Conventions

- TypeScript `strict: true` everywhere; no `any` without a comment explaining why.
- ESLint + Prettier; lint, typecheck and tests must pass before every commit that closes a phase.
- API base path: `/api/v1`.
- Error shape (every non-2xx): `{"error": {"code": "UPPER_SNAKE", "message": "...", "details": ...}}`
  (`details` optional, e.g. zod issues). Codes: `VALIDATION_ERROR` 400, `INVALID_CREDENTIALS` 401,
  `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `EMAIL_TAKEN` 409, `DUPLICATE_NAME` 409,
  `CATEGORY_NOT_EMPTY` 409, `CATEGORY_CYCLE` 409, `NOTATION_KIND_MISMATCH` 422,
  `INTERNAL_ERROR` 500.
- Paginated responses: `{"items": [...], "page": 1, "pageSize": 20, "total": 123}`. `page` starts
  at 1, `pageSize` default 20, max 50 (larger values -> `VALIDATION_ERROR`).
- Request validation: zod schemas from `packages/shared`, never ad-hoc checks in controllers.
- Thin controllers; logic in services; Prisma used only in services.
- Auth: `Authorization: Bearer <JWT>` (HS256, `JWT_SECRET`, 1 day expiry, payload `{sub, role}`).
  Passwords hashed with bcrypt via `bcryptjs` (cost 10). Password min 8 chars.
- Env vars documented in `.env.example` per app; real `.env` files are never committed.
- Keywords are stored trimmed and lowercase; normalise in the shared zod schema.
- Git: all work is committed directly on `main` (no branches; single maintainer), one task per
  commit, diff shown to Dinesh before committing; conventional commits
  (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`, `ci:`).
- Every phase keeps lint, typecheck and tests green and updates `docs/PROGRESS.md`.

## Data model (Prisma, exact names)

```
enum Role          { CATALOGUER USER }
enum ComponentKind { DESIGN CODE }

User(id cuid, name, email unique, passwordHash, role Role, createdAt)
Category(id cuid, name, slug, description?, parentId? -> Category (self-relation "children"),
         createdAt, updatedAt; @@unique([parentId, name]))
Notation(id cuid, name unique, kind ComponentKind)
Component(id cuid, name, description, kind ComponentKind, notationId -> Notation,
          categoryId -> Category, version default "1.0.0", author?, sourceUrl?, content? @db.Text,
          createdById -> User, useCount Int default 0, queryHitCount Int default 0,
          queryHitNotUsedCount Int default 0, lastUsedAt?, createdAt, updatedAt)
Keyword(id cuid, term unique)                     -- trimmed, lowercase
ComponentKeyword(componentId, keywordId)          -- @@id([componentId, keywordId]); onDelete Cascade from Component
SearchQuery(id cuid, userId? -> User, terms String[], filters Json, resultCount Int, createdAt)
SearchResult(queryId, componentId, rank Int, used Boolean default false)
                                                  -- @@id([queryId, componentId]); onDelete Cascade from Component and SearchQuery
UsageEvent(id cuid, componentId, userId? -> User, queryId? -> SearchQuery, createdAt)
                                                  -- onDelete Cascade from Component
AuditLog(id cuid, actorId -> User, action, entityType, entityId, details Json?, createdAt)
```

Rules:
- `notation.kind` must equal `component.kind`, else `NOTATION_KIND_MISMATCH` (checked on create and on
  every update that changes `kind` or `notationId`).
- Postgres treats NULL `parentId` as distinct, so the service also rejects duplicate root names.
- A category cannot be moved under itself or a descendant (`CATEGORY_CYCLE`).
- Seed notations: UML, ERD, Structured Design, DFD (`DESIGN`); Java, Python, C, C++, JavaScript,
  TypeScript (`CODE`). Seed also creates cataloguer account(s) and a small demo category tree.
- AuditLog `action` values: `COMPONENT_CREATE`, `COMPONENT_UPDATE`, `COMPONENT_DELETE`,
  `COMPONENT_PURGE`, `KEYWORDS_UPDATE`, `CATEGORY_CREATE`, `CATEGORY_UPDATE`, `CATEGORY_DELETE`,
  `NOTATION_CREATE`. Every cataloguer write adds one row in the same transaction.

## Counter rules (one Prisma transaction per operation)

- **Search** (`POST /search`): create a `SearchQuery`; for each component **on the returned page**:
  `queryHitCount + 1`, `queryHitNotUsedCount + 1`, and a `SearchResult(queryId, componentId, rank)`.
  Components on other pages are not counted. `GET /components?q=` does **not** touch counters.
- **Use** (`POST /components/:id/use {queryId?}`): if `queryId` is given and its `SearchResult` for
  this component has `used = false`: set `used = true` and `queryHitNotUsedCount - 1` (never below 0).
  Every use (with or without `queryId`): `useCount + 1`, `lastUsedAt = now()`, one `UsageEvent` row.
  A `queryId` with no `SearchResult` for this component is ignored for the hit logic (still a use).

## Search ranking

- Input terms are trimmed, lowercased, de-duplicated; 1..10 terms, each 1..50 chars.
- Per term, a component's best keyword match scores: **2** if a keyword equals the term,
  **1** if a keyword starts with the term and the term length is >= 3, else 0.
  Component score = sum over terms.
- `match: "all"`: every term must score > 0. `match: "any"`: at least one term scores > 0.
- Filters (`kind`, `notationId`, `categoryId` + `includeDescendants`) apply before ranking.
- Order: `score desc, useCount desc, name asc`. Each item carries `matchedKeywords` and `score`.

## Purge candidates

A component is a candidate when all hold: `useCount <= maxUses` (default 0),
`queryHitNotUsedCount >= minNotUsedHits` (default 0), `lastUsedAt` is null or older than
`unusedForDays` (default 90), and `createdAt` older than `olderThanDays` (default 30).
`POST /reports/purge` re-evaluates the criteria server-side and deletes only ids that still
qualify (returns deleted and skipped ids), writing one `COMPONENT_PURGE` audit row per deletion.

## API contract (all under `/api/v1`)

Auth column: `-` public (token optional), `LOGIN` any logged-in user, `CAT` CATALOGUER only.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | - | Liveness + DB check |
| POST | `/auth/register` | - | Create a USER, return token + user |
| POST | `/auth/login` | - | Return token + user |
| GET | `/auth/me` | LOGIN | Current user |
| GET | `/categories/tree` | - | Full category tree with component counts |
| GET | `/categories/:id` | - | Category with breadcrumb and children |
| GET | `/categories/:id/components` | - | Paginated components; `includeDescendants&page&pageSize&sort` |
| POST | `/categories` | CAT | Create category |
| PATCH | `/categories/:id` | CAT | Rename / describe / move category |
| DELETE | `/categories/:id` | CAT | Delete; `?reassignTo=<id>` moves children and components first |
| GET | `/notations` | - | List notations; `?kind` |
| POST | `/notations` | CAT | Create notation |
| GET | `/components` | - | List/filter; `kind&notationId&categoryId&includeDescendants&q&sort&page&pageSize` |
| GET | `/components/:id` | - | Component detail with notation, category breadcrumb, keywords |
| POST | `/components` | CAT | Create component (optionally with `keywords`) |
| PATCH | `/components/:id` | CAT | Update component fields |
| DELETE | `/components/:id` | CAT | Delete component |
| PUT | `/components/:id/keywords` | CAT | Replace keyword set |
| POST | `/components/:id/keywords` | CAT | Add keywords |
| DELETE | `/components/:id/keywords/:keywordId` | CAT | Remove one keyword |
| GET | `/keywords` | - | Autocomplete; `prefix&limit` (limit default 10, max 50) |
| POST | `/search` | - | Keyword search; records query and hit counters |
| POST | `/components/:id/use` | LOGIN | Mark used; `{queryId?}` |
| GET | `/reports/summary` | CAT | Totals, by kind, top used, top not-used hits |
| GET | `/reports/purge-candidates` | CAT | `maxUses&minNotUsedHits&unusedForDays&olderThanDays` |
| POST | `/reports/purge` | CAT | `{componentIds, params}` delete candidates |
| GET | `/reports/audit` | CAT | Paginated audit log |

`sort` values: `name` (default), `newest`, `mostUsed`.
`POST /search` body: `{keywords: string[], match: "any"|"all", kind?, notationId?, categoryId?,
includeDescendants?, page?, pageSize?}` -> `{queryId, items: [{...component, matchedKeywords, score}],
page, pageSize, total}`.

## Commands

Run from the repo root unless noted. Local Postgres databases `sccs_dev` and `sccs_test`
(URLs in `apps/api/.env`, copied from `.env.example`).

First-time setup (verified 30 Sep 2026 on Node 22, Postgres 16):

```
npm install                                   # also runs prisma generate (needs no .env or database)
cp apps/api/.env.example apps/api/.env        # needed from here on: migrate, seed, dev, tests
cp apps/web/.env.example apps/web/.env.local  # NEXT_PUBLIC_API_URL
# create DBs sccs_dev and sccs_test; if Postgres needs a password over TCP, put it in the URLs
npm run db:migrate -w @sccs/api               # or db:deploy to just apply existing migrations
npm run db:seed -w @sccs/api                  # notations, cataloguer (SEED_CATALOGUER_*), demo data
```

Everyday:

```
npm run dev                          # api :4000 (tsx watch) and web :3000 (next dev)
npm run lint | typecheck | test      # all workspaces (test = shared unit + api unit/integration w/ coverage)
npm run format:check                 # prettier
npm run test:e2e                     # Playwright; starts api :4000 and web :3001 itself; needs seeded DB
npm run build -w @sccs/web
npm run build -w @sccs/api           # prisma generate + esbuild serverless bundle
```

Integration tests run against `DATABASE_URL_TEST` (vitest overrides `DATABASE_URL` with it).
