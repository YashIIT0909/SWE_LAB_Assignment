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
- **Not confirmed yet:** CI has to run on GitHub after a push to prove it.

## Also

- `.gitignore` now ignores `00_Temp_patches/`.
- Local git setting `core.autocrlf=false` and LF line endings, so `format:check` passes on Windows.
