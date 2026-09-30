# Changelog (my changes, Phase 2)

Changes made after taking over the project, one entry per commit. Everything was checked with
`npm run lint`, `format:check`, `typecheck` and `npm test`; items 3 and 4 also ran against real HTTP
and the Playwright E2E suite (9 of 9 passing).

## 1. Fresh `npm install` works without `.env`

- **What:** `prisma.config.ts` now uses `process.env.DIRECT_URL ?? ''` instead of `env('DIRECT_URL')`.
  Setup steps in `CLAUDE.md` updated (`npm install` first, `.env` afterwards).
- **Why:** the `postinstall` step runs `prisma generate`, which loads this config, and `env()` throws
  when the variable is missing. Generating the client needs no database. Migrate and seed still read
  the real value from `.env`.
- **Files:** `apps/api/prisma.config.ts`, `CLAUDE.md`.

## 2. No hard-coded JWT secret

- **What:** `secret()` in `auth.service.ts` throws `JWT_SECRET is not set` instead of returning a
  fixed fallback string. New test `auth.secret.test.ts` checks that `sign()` throws.
- **Why:** anyone reading the repo could have forged a cataloguer token on a server without
  `JWT_SECRET`. This also makes SRS NFR-2 ("JWT secret from env only") true.
- **Files:** `apps/api/src/services/auth.service.ts`, `apps/api/test/auth.secret.test.ts`.

## 3. CORS allow-list actually applies

- **What:** the last line of the origin callback in `app.ts` is now `callback(null, false)`. No-Origin
  requests, `WEB_ORIGIN` entries, `*`, `http://localhost:*` and `*.vercel.app` are still allowed.
  CORS sentence in `CLAUDE.md` rewritten.
- **Why:** the old final `callback(null, true)` accepted every origin, so the list above it did
  nothing. Note: an unset `WEB_ORIGIN` still allows everything, so set it on Vercel.
- **Files:** `apps/api/src/app.ts`, `CLAUDE.md`.

## 4. Purge page has candidates in a demo

- **What:** the seed also creates three unused components (Legacy XML parser, Bubble sort demo, Old
  billing DFD) with `createdAt` 60 days ago. Still idempotent (matched by name). The create loop became
  a helper `addComponents(list, createdAt?)`.
- **Why:** seeded components were new, and the default `olderThanDays` is 30, so `candidateWhere()` in
  `report.service.ts` excluded all of them and the purge page showed nothing.
- **Files:** `apps/api/prisma/seed.ts`, `apps/api/prisma/seed-data.ts`.
- **Note:** the E2E test t43 really purges the first candidate, so run E2E only against a local
  database, then re-seed.

## 5. CI seed step no longer fails

- **What:** `SEED_CATALOGUER_EMAIL` and `SEED_CATALOGUER_PASSWORD` added to the job `env` in `ci.yml`
  (dummy values from `.env.example`).
- **Why:** run #8 failed at `npx prisma db seed` with "SEED_CATALOGUER_PASSWORD is not set". The E2E
  specs t42 and t43 log in with exactly these values.
- **Files:** `.github/workflows/ci.yml`.
- **Result:** CI ran green on GitHub after the push (3 of 3 runs).

## Also

- `.gitignore` now ignores `00_Temp_patches/`.
- Local git setting `core.autocrlf=false` and LF line endings, so `format:check` passes on Windows.

# Phase 3 (SRS and docs)

## 6. SRS rewritten

- **What:** `docs/01-SRS.md` now contains only functional and non-functional requirements, grouped by
  feature. FR-1..FR-27 keep their IDs. NFRs reworded to what the code and tests show: NFR-1 (the
  benchmark times in-memory ranking only), NFR-5 (axe scan of five public pages, keyboard search flow),
  NFR-6 (health check instead of 99 % availability). Added NFR-10 (auth rate limit) and NFR-11 (CORS).
- **Why:** the brief asks for FR and NFR only, and some claims (99 % availability, WCAG AA, p95 for the
  endpoint) could not be backed by anything in the repo.
- **Files:** `docs/01-SRS.md`.

## 7. Other docs brought in line

- **What:** `05-api.md` (CORS, JWT secret, `RATE_LIMITED`), `06-test-plan.md` (no web unit tests, real CI
  steps, T-47 and T-48, results), `08-report.md` (real test counts and coverage, honest perf and
  accessibility wording), `07-project-plan.md` (assignment phases), new `docs/README.md` index.
- **Tests renamed:** the JWT secret test is now `T-47` and the rate limit test `T-48`, so the test plan
  and the code use the same IDs. No logic changed.
- **Files:** `docs/05-api.md`, `docs/06-test-plan.md`, `docs/07-project-plan.md`, `docs/08-report.md`,
  `docs/README.md`, `apps/api/test/auth.int.test.ts`, `apps/api/test/auth.secret.test.ts`.

# Phase 4 (UML)

## 8. UML diagrams in PlantUML

- **What:** new `docs/diagrams/` folder with editable `.puml` sources and PNG and SVG exports:
  a use case diagram (UC-1 to UC-14), a domain class diagram taken from `schema.prisma`, and a backend
  class diagram of routes, middleware, controllers and services drawn from the real imports.
- **Why:** the old use case diagram was a Mermaid flowchart imitating UML, with wrong «extend» directions
  and a false «include». The old class diagram had operations on the wrong services and missed several
  services and associations.
- **Files:** `docs/diagrams/*`.

## 9. Docs updated for the diagrams

- **What:** `02-use-cases.md` (new diagram and table, UC-13 and UC-14, UC-10 split), `04-design.md`
  (section 4 rewritten with a relationship table, layer table and source layout corrected, CORS line,
  `/console/reports` fixed, three sequence diagrams corrected), `08-report.md` (FR-3 to UC-13, FR-22 to
  UC-14), `README.md` index.
- **Files:** `docs/02-use-cases.md`, `docs/04-design.md`, `docs/08-report.md`, `docs/README.md`,
  `docs/07-project-plan.md`, `docs/STATUS.md`, `docs/PROGRESS.md`.

# Phase 5 (PPT)

## 10. PPT comparison and change instructions

- **What:** compared the 11-slide PPT with the code, SRS and UML and wrote `docs/PPT_Modify.md`: the
  facts to use, what is wrong on each slide, the new slide list (16 main and 2 appendix slides, with new
  requirements, architecture and demo slides), a new colour palette and fonts, the exact text of every
  slide, the diagram and screenshot images to add by hand, prompts for transparent AI-made illustrations,
  and a list of claims that must not appear.
- **Main findings:** the old deck said purge is an automated daemon, listed a Spring Boot, Docker and JUnit
  stack, showed a class model with classes that do not exist, and had no requirements or demo slides.
- **Files:** `ppt/PPT_Modify.md`. The old `.pptx` is not changed.

## 11. Presentation package

- **What:** new `ppt/` folder with `PPT_Modify.md` (rewritten now that the images exist), a copy of the old
  deck, copies of the context documents, 8 diagrams (PNG and SVG) and 7 screenshots, so the deck can be
  rebuilt in one go. Added sequence diagrams (add, search, use) and both data flow diagrams as PlantUML,
  and a shared `sccs-theme.puml` so every diagram uses the new teal and amber palette.
- **Screenshots:** captured with Playwright against the local database only (never the live one); the dev
  badge and the site footer were left out.
- **Files:** `ppt/`, `docs/diagrams/*`.
