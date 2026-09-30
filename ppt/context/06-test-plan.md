# Test Plan

## 1. Scope and objectives

Verify every functional requirement FR-1..FR-27 and the testable non-functional requirements
of `docs/01-SRS.md`. The test case IDs below (T-01..T-48) are the ones in the traceability matrix
of `docs/08-report.md`. Each implementing phase names its test files after the IDs (for example
`it("T-21 search increments hit counters for page items only", ...)`) so the matrix can be
checked with a grep.

## 2. Strategy

### 2.1 Levels

| Level | What | Tooling | Where |
|---|---|---|---|
| Unit | Pure functions: keyword normalisation, search scoring and ordering, purge-criteria builder, slug generation, category cycle check, zod schemas | Vitest | `apps/api/src/**/*.test.ts`, `packages/shared/src/**/*.test.ts` |
| Unit (UI) | Not implemented: the web app has no unit tests; its behaviour is covered at the end-to-end level | - | - |
| Integration | Each endpoint through the Express app against a real PostgreSQL test database (migrated, truncated between tests, seeded per test) | Vitest + Supertest | `apps/api/test/*.int.test.ts` |
| End-to-end | Full user journeys in a browser against web + api + database | Playwright (+ `@axe-core/playwright`) | `apps/web/e2e/*.spec.ts` |
| Performance | Ranking time of the search scorer on a generated 10,000-component, 5,000-keyword dataset (in process; no database or HTTP) | Vitest | `apps/api/test/perf/` |

Integration tests use a dedicated database (`DATABASE_URL_TEST`: a Postgres service container in CI or a local
Postgres via Docker). They never run against production.

### 2.2 Black-box techniques

**Equivalence classes and boundary values — search input (`POST /search`)**

| Input | Valid classes | Invalid classes | Boundary values tested |
|---|---|---|---|
| `keywords` count | 1..10 | 0, > 10, not an array | 0, 1, 10, 11 |
| term length (after trim) | 1..50 | 0 (empty / whitespace only), > 50 | "", " ", 1, 50, 51 chars |
| term case / spacing | any | - | `" CSV "` equals `"csv"`; duplicates `["csv","CSV"]` count once |
| prefix scoring | term length >= 3 | term length 1..2 gives no prefix score | 2 chars (no prefix), 3 chars (prefix) |
| `match` | `any`, `all` | missing, other string | `"ALL"` rejected |
| `kind` | `DESIGN`, `CODE`, absent | other | - |
| `notationId`/`categoryId` | existing id | unknown id (404), malformed | - |

**Pagination (all list endpoints and search)**

| Input | Valid | Invalid | Boundaries |
|---|---|---|---|
| `page` | integer >= 1 | 0, negative, non-integer, text | 0, 1, last page, last page + 1 (empty items) |
| `pageSize` | 1..50 | 0, > 50 | 0, 1, 50, 51 |

**Counters**

| Situation | Expected |
|---|---|
| Component on returned page | `queryHitCount +1`, `queryHitNotUsedCount +1`, SearchResult row |
| Component matching but on another page | unchanged |
| Use with `queryId`, result `used=false` | `used=true`, `queryHitNotUsedCount -1`, `useCount +1` |
| Use again with same `queryId` | `useCount +1`, `queryHitNotUsedCount` unchanged |
| Use without `queryId` | `useCount +1` only (plus `lastUsedAt`, UsageEvent) |
| `queryHitNotUsedCount` already 0 with an unused SearchResult (data drift) | stays 0 |
| Failure mid-transaction (forced) | no counter or row changes |

**Purge criteria** — boundaries at each threshold: `useCount = maxUses` (candidate) vs
`maxUses + 1` (not); `queryHitNotUsedCount = minNotUsedHits` vs `minNotUsedHits - 1`;
`lastUsedAt` exactly `unusedForDays` ago +/- 1 minute; `createdAt` exactly `olderThanDays` ago +/- 1 minute;
`lastUsedAt = null`.

### 2.3 White-box techniques

- Statement and branch coverage measured with Vitest (`@vitest/coverage-v8`).
- Target: **>= 80 % line coverage for `apps/api/src/services`** (enforced as a CI threshold from
  Phase 5), >= 70 % overall for `apps/api`.
- Branch-focused tests for: search scoring (exact / prefix / short term / no match / all vs
  any), `UsageService.use` (all four paths of queryId handling), category delete (empty /
  non-empty without target / with target / cyclic target), notation-kind check on create and
  update.

## 3. Test cases

Level: U unit, I integration, E end-to-end, P performance. Technique: BB black box (EC
equivalence class, BVA boundary value), WB white box.

| ID | FR / NFR | Level | Technique | Description | Expected result |
|---|---|---|---|---|---|
| T-01 | FR-1, NFR-6 | I | BB | `GET /health` with DB up | 200 `{status:"ok", db:"ok"}` |
| T-02 | FR-13 | I | EC | Register valid user, body includes `role: "CATALOGUER"` | 201, role `USER`, token returned |
| T-03 | FR-13 | I | EC | Register with an existing email (different case) | 409 `EMAIL_TAKEN` |
| T-04 | FR-13 | I | EC | Login correct; wrong password; unknown email | 200; 401 `INVALID_CREDENTIALS` twice |
| T-05 | FR-13 | I | EC | `GET /auth/me` with no token, malformed token, expired token, valid token | 401 x3, 200 |
| T-06 | FR-12, NFR-3 | I | EC | USER token on every CAT endpoint; no token on every CAT endpoint | 403 `FORBIDDEN`; 401 `UNAUTHENTICATED` |
| T-07 | FR-1, FR-2, FR-4, FR-8, FR-22 | I | EC | Create DESIGN component with UML notation and keywords | 201, counters 0, keywords normalised, audit `COMPONENT_CREATE` |
| T-08 | FR-7 | I, U | EC, WB | Create CODE component with UML notation | 422 `NOTATION_KIND_MISMATCH`, nothing written |
| T-09 | FR-2, FR-4, FR-8, NFR-4 | I | BVA | Missing name; name 120/121 chars; bad `sourceUrl`; invalid kind; client-sent `useCount` | 400 `VALIDATION_ERROR` (`useCount` ignored/rejected) |
| T-10 | FR-7, FR-9 | I | EC, WB | PATCH description; PATCH kind only so it mismatches notation; PATCH unknown id | 200; 422; 404 |
| T-11 | FR-10, NFR-8 | I | EC | Delete component that has keywords, search results, usage events | 204; related rows gone; `Keyword` rows remain; audit row |
| T-12 | FR-11 | I, U | EC, BVA | PUT keywords `[" CSV","csv","Parser"]`; PUT `[]`; term of 51 chars | `["csv","parser"]`; empty set; 400 |
| T-13 | FR-11 | I | EC | POST existing + new terms; DELETE linked keyword; DELETE unlinked keyword | Existing `Keyword` reused; link removed; 404 |
| T-14 | FR-5, FR-6 | I | EC | `GET /notations`, `?kind=DESIGN`, `?kind=CODE` after seed | 10 notations; 4 design (UML, ERD, Structured Design, DFD); 6 code |
| T-15 | FR-7 | I | EC | Create notation `Rust/CODE`; create `uml` again | 201; 409 `DUPLICATE_NAME` |
| T-16 | FR-14, FR-15 | U, I | EC, BVA | Keywords `parser`,`parsers`; terms `parser` (exact 2), `par` (prefix 1), `pa` (0) | Scores 2, 1, no match |
| T-17 | FR-14 | U, I | EC | Terms `csv`,`xml` with match all vs any | all: only components with both; any: either |
| T-18 | FR-15 | U | WB | Ties on score broken by useCount desc then name asc | Deterministic order as specified |
| T-19 | FR-15 | I | EC | Filters kind, notationId, categoryId with and without includeDescendants | Only matching components returned |
| T-20 | FR-14, NFR-4 | I | BVA | 0, 1, 10, 11 terms; term lengths 0, 1, 50, 51; missing match | 400, 200, 200, 400; 400, 200, 200, 400; 400 |
| T-21 | FR-18 | I | EC | 25 matches, pageSize 20, request page 2 | Only 5 page-2 components get +1/+1 and SearchResult rows; `resultCount` 25; rank 21..25 |
| T-22 | FR-17, FR-18 | I | EC | Use with queryId whose SearchResult is unused | used=true, notUsed -1, useCount +1, lastUsedAt set, UsageEvent with queryId |
| T-23 | FR-18 | I | EC | Use twice with the same queryId | Second call: useCount +1, notUsed unchanged, `countedQueryHit:false` |
| T-24 | FR-17, FR-18 | I, U | BVA, WB | Use without queryId; with unknown queryId; with notUsed already 0 | Plain use each time; notUsed never < 0 |
| T-25 | FR-17, NFR-3 | I | EC | Use without token; use on unknown component | 401; 404 |
| T-26 | FR-18, NFR-8 | I | WB | Force failure after SearchQuery insert (mocked) inside search and use transactions | No partial rows or counter changes |
| T-27 | FR-15, FR-26, NFR-4 | I | BVA | page 0, 1, last, last+1; pageSize 0, 1, 50, 51 on list and search | 400, 200, 200 (items), 200 (empty); 400, 200, 200, 400 |
| T-28 | FR-25 | I | EC | Tree with 3 levels and component counts | Correct nesting, direct and total counts |
| T-29 | FR-25 | I | EC | Category detail of a level-3 node; unknown id | Breadcrumb root-first incl. self, children; 404 |
| T-30 | FR-26 | I | EC | Category components with includeDescendants false/true, each sort | Direct only vs whole subtree; correct order; no counter change |
| T-31 | FR-23 | I | EC | Create duplicate sibling name (under parent and at root); same name under different parents | 409, 409; 201 |
| T-32 | FR-23 | I, U | WB | Move category under itself; under its grandchild; under unrelated node | 409 `CATEGORY_CYCLE` x2; 200 |
| T-33 | FR-24 | I | WB | Delete empty; non-empty without reassignTo; with valid reassignTo; with descendant reassignTo | 200; 409 `CATEGORY_NOT_EMPTY`; items moved and deleted; 409 `CATEGORY_CYCLE` |
| T-34 | FR-27 | I | EC | `GET /components` by kind, notation, category, q substring | Correct filter; counters unchanged; no SearchQuery row |
| T-35 | FR-16 | I | BVA | `GET /keywords?prefix=cs&limit=1`, `limit=50`, `limit=51`, empty prefix | 1 item; <= 50; 400; most-used terms |
| T-36 | FR-19 | I | EC | Summary on seeded data and on empty catalogue | Totals match DB; top lists <= 10; zeros when empty |
| T-37 | FR-20 | I, U | BVA | Candidates at each threshold boundary (see 2.2) | Included exactly at boundary, excluded one step past |
| T-38 | FR-21, FR-22 | I | EC | Purge 2 ids where one was used after listing, plus one unknown id | 1 deleted, 2 skipped with reasons; audit `COMPONENT_PURGE` |
| T-39 | FR-22 | I | EC | Perform one of each write, then `GET /reports/audit` with filters | One row per write, newest first, filter works |
| T-40 | NFR-1 | P | BB | 10,000 candidate components, 5,000 keywords, 200 random runs of the `rank()` function (2 terms, any/all) | p95 < 500 ms (in process; database and network time not measured) |
| T-41 | FR-14, FR-17, NFR-5 | E | BB | User registers, browses to a category, searches, opens result, clicks Use | Counters shown updated; journey <= 3 screens from search to use |
| T-42 | FR-8, FR-9, FR-10 | E | BB | Cataloguer logs in, adds component with keywords, edits it, deletes it | Each change visible in UI and lists |
| T-43 | FR-19, FR-21 | E | BB | Cataloguer opens reports, runs purge on a seeded never-used component | Component gone from browse and search |
| T-44 | FR-13, NFR-2 | I | WB | Inspect DB after register; inspect every user-returning response | `passwordHash` is bcrypt (`$2`), never in responses |
| T-45 | NFR-5 | E | BB | axe scan of `/`, `/search`, `/browse`, `/login`, `/register`; keyboard-only search flow | No serious/critical violations; flow completes by keyboard |
| T-46 | FR-3 | I | EC | `GET /components/:id` existing and unknown | Detail with content, notation, breadcrumb, keywords, createdBy; 404 |
| T-47 | NFR-2 | U | WB | `sign()` called with `JWT_SECRET` removed from the environment | Throws `JWT_SECRET is not set`; no token is issued |
| T-48 | NFR-10 | I | BVA | 21 login requests from one IP with the limiter enabled | The 21st gets 429 `RATE_LIMITED` with a `Retry-After` header |

## 4. Entry and exit criteria

**Entry (per phase)**
- Requirements and API for the phase are in `docs/` and `CLAUDE.md`.
- The code compiles (`typecheck` passes) and migrations apply to a clean test database.
- Seed data for the phase exists.

**Exit (per phase)**
- All test cases for the FRs implemented in the phase pass; no skipped tests without an issue link.
- Lint, typecheck and all tests green in CI.
- Service line coverage >= 80 % (from Phase 5 on).
- `docs/PROGRESS.md` updated; the traceability matrix test IDs exist in code.

**Exit (release, Phase 8)**
- All T-01..T-46 pass against the production-like deployment (E2E on the Vercel preview).
- T-40 meets NFR-1.
- No open defect of severity high or critical.

**Suspension / resumption**: testing of a phase is suspended if the test database cannot be
migrated or CI is red on `main`; it resumes when the blocking fix is merged.

## 5. Tools and environment

| Purpose | Tool |
|---|---|
| Unit and integration runner | Vitest (+ `@vitest/coverage-v8`) |
| HTTP integration | Supertest against `app.ts` (no network listener) |
| UI unit | not used |
| End-to-end, accessibility | Playwright, `@axe-core/playwright` |
| Performance | Vitest test timing the ranking function |
| Database | PostgreSQL 16 (service container in CI, local Postgres or Docker locally) |
| CI | GitHub Actions: install, lint, format check, typecheck, migrate, test (with Postgres service), web build, seed, E2E |

## 6. Defect management

Defects are GitHub issues labelled `bug` with severity (`critical`, `high`, `medium`, `low`), the
failing test ID and steps to reproduce. A fix PR adds or updates a test with that ID.

## 7. Results (30 Sep 2026)

| Level | Result |
|---|---|
| Shared package unit tests | 5 passed |
| API unit and integration tests | 56 passed in 9 files (`npm test`), line coverage 98.31 % overall, 99.61 % for services |
| End-to-end (Playwright, Chromium) | 9 passed (T-41, T-42, T-43, T-45 with 6 axe and keyboard tests) |
| CI (GitHub Actions) | green on `main` |

Checked by hand, not automated: CORS behaviour (allowed and unknown origins over real HTTP) and the
purge candidates listing with default parameters after seeding. The web app has no unit tests.
