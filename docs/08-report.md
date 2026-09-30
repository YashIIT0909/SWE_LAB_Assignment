# Final Project Report — Software Component Cataloguing System (SCCS)

**Course**: Software Engineering Lab  
**System**: Software Component Cataloguing System (SCCS)  
**Requirements**: `docs/01-SRS.md` (functional and non-functional requirements)  
**Tech Stack**: Next.js 16 (App Router), React 19, TypeScript (strict), Express 5, Prisma 7, PostgreSQL, Tailwind CSS, Playwright, Vitest  

---

## 1. Executive Summary

The Software Component Cataloguing System (SCCS) is a production-grade web platform for cataloguing, discovering, classifying, and managing the lifecycle of reusable software components. 

The system implements the complete requirements set out in the problem statement:
1. **Dual Component Classification**: High-level system designs (UML, ERD, Structured Design, DFD) and runnable code snippets (Java, Python, C, C++, JavaScript, TypeScript) catalogued under strict notation-kind validation.
2. **Hierarchical Category Classification**: Arbitrary-depth category tree with recursive component count aggregation, cycle prevention, and atomic reassignment on deletion.
3. **Keyword-Driven Search & Ranking**: Scoring engine that prioritizes exact keyword matches (weight 2) and prefix matches (weight 1 for terms $\ge 3$ characters), supporting both `any` and `all` conjunction modes.
4. **Autonomous Usage & Query Tracking**: Atomic transactional counters recording total uses (`useCount`), appearances in search results (`queryHitCount`), and search appearances not followed by a use (`queryHitNotUsedCount`).
5. **Criteria-Based Component Purging**: Automated candidate discovery and multi-parameter purge workflow allowing cataloguers to prune obsolete components safely with comprehensive audit logging.
6. **Robust Hardening & Security**: BCrypt password hashing, stateless HS256 JWT tokens, sliding-window rate limiting on sensitive routes, and role-based access control.

---

## 2. Requirement Traceability Matrix

Every functional requirement in `docs/01-SRS.md` traces to use cases, API routes, automated tests, and implementation source files (each NFR lists its own check in the SRS table). The use case IDs refer to `docs/02-use-cases.md`, which is being redone in the UML phase:

| FR ID | Description | Use Case | API Endpoint | Test ID | Verification File | Implementation File(s) |
|---|---|---|---|---|---|---|
| **FR-1** | Persistent component catalogue | UC-2, UC-8 | `GET /health`, `/components` | T-01, T-07 | `health.int.test.ts`, `components.int.test.ts` | `src/services/component.service.ts` |
| **FR-2** | Full component metadata | UC-2 | `POST /components`, `GET /components/:id` | T-07, T-09 | `components.int.test.ts` | `src/services/component.service.ts` |
| **FR-3** | Public component viewing | UC-8, UC-6 | `GET /components/:id` | T-46 | `components.int.test.ts` | `apps/web/app/components/[id]/page.tsx` |
| **FR-4** | Binary kind (`DESIGN` vs `CODE`) | UC-2 | `POST /components` | T-07, T-09 | `components.int.test.ts` | `packages/shared/src/schemas.ts` |
| **FR-5** | Design notations (UML, ERD, etc.) | UC-12 | `GET /notations?kind=DESIGN` | T-14 | `categories.int.test.ts` | `src/services/notation.service.ts` |
| **FR-6** | Code notations (Java, Python, etc.)| UC-12 | `GET /notations?kind=CODE` | T-14 | `categories.int.test.ts` | `src/services/notation.service.ts` |
| **FR-7** | Notation kind constraint | UC-12, UC-2 | `POST /notations`, `POST /components` | T-08, T-10, T-15 | `components.int.test.ts` | `src/services/component.service.ts` |
| **FR-8** | Cataloguer component creation | UC-2 | `POST /components` | T-07, T-09, T-42 | `components.int.test.ts`, `t42-catalogue-component.spec.ts` | `src/controllers/component.controller.ts` |
| **FR-9** | Cataloguer component editing | UC-3 | `PATCH /components/:id` | T-10, T-42 | `components.int.test.ts`, `t42-catalogue-component.spec.ts` | `apps/web/app/console/components/[id]/page.tsx` |
| **FR-10**| Component deletion & cascade | UC-4 | `DELETE /components/:id` | T-11, T-42 | `components.int.test.ts`, `t42-catalogue-component.spec.ts` | `src/services/component.service.ts` |
| **FR-11**| Keyword association & management | UC-5, UC-2 | `PUT/POST/DELETE /components/:id/keywords` | T-12, T-13 | `components.int.test.ts` | `src/services/keyword.service.ts` |
| **FR-12**| Role-based write restrictions | UC-2..5, 9..12| All cataloguer routes | T-06 | `components.int.test.ts` | `src/middleware/auth.ts` |
| **FR-13**| User registration & login | UC-1 | `POST /auth/register`, `POST /auth/login` | T-02..05, T-44 | `auth.int.test.ts` | `src/services/auth.service.ts` |
| **FR-14**| Keyword query (1–10 terms) | UC-6 | `POST /search` | T-16, T-17, T-20, T-41 | `search.int.test.ts`, `t41-browse-search-use.spec.ts` | `src/services/search.service.ts` |
| **FR-15**| Search ranking & filters | UC-6 | `POST /search` | T-16, T-18, T-19, T-27, T-40 | `search.perf.test.ts`, `search.service.test.ts` | `src/services/search.service.ts` |
| **FR-16**| Keyword suggestion autocomplete | UC-6, UC-5 | `GET /keywords` | T-35 | `components.int.test.ts` | `src/services/keyword.service.ts` |
| **FR-17**| Usage recording (`useCount`) | UC-7 | `POST /components/:id/use` | T-22, T-24, T-25, T-41 | `search.int.test.ts`, `t41-browse-search-use.spec.ts` | `src/services/usage.service.ts` |
| **FR-18**| Search hit & not-used counters | UC-6, UC-7 | `POST /search`, `POST /components/:id/use` | T-21..24, T-26 | `search.int.test.ts` | `src/services/search.service.ts`, `usage.service.ts` |
| **FR-19**| Cataloguer summary reports | UC-10 | `GET /reports/summary` | T-36, T-43 | `reports.int.test.ts`, `t43-purge-flow.spec.ts` | `apps/web/app/console/page.tsx` |
| **FR-20**| Purge candidate query | UC-11 | `GET /reports/purge-candidates` | T-37 | `reports.int.test.ts` | `src/services/report.service.ts` |
| **FR-21**| Purge execution & re-verification| UC-11 | `POST /reports/purge` | T-38, T-43 | `reports.int.test.ts`, `t43-purge-flow.spec.ts` | `apps/web/app/console/purge/page.tsx` |
| **FR-22**| Comprehensive audit logging | UC-10 | `GET /reports/audit` | T-39 | `reports.int.test.ts` | `apps/web/app/console/audit/page.tsx` |
| **FR-23**| Category hierarchy management | UC-9 | `POST /categories`, `PATCH /categories/:id` | T-31, T-32 | `categories.int.test.ts` | `apps/web/app/console/categories/page.tsx` |
| **FR-24**| Category deletion with reassign | UC-9 | `DELETE /categories/:id?reassignTo=` | T-33 | `categories.int.test.ts` | `src/services/category.service.ts` |
| **FR-25**| Category browsing & tree view | UC-8 | `GET /categories/tree`, `GET /categories/:id` | T-28, T-29 | `categories.int.test.ts` | `apps/web/app/browse/[[...id]]/page.tsx` |
| **FR-26**| Category component listing | UC-8 | `GET /categories/:id/components` | T-30, T-27 | `components.int.test.ts` | `apps/web/components/component-list.tsx` |
| **FR-27**| Filtered component browsing | UC-8 | `GET /components` | T-34 | `components.int.test.ts` | `apps/web/app/console/components/page.tsx` |

---

## 3. Test Suite & Quality Verification

### 3.1 Unit & Integration Test Coverage
- **Runner**: Vitest v4.1 with `@vitest/coverage-v8`
- **Total Test Files**: 9 files in `apps/api` (plus 1 in `packages/shared`)
- **Total Unit & Integration Tests**: 56 in `apps/api` (plus 5 in `packages/shared`)
- **Result**: **all passing** (last run 30 Sep 2026, and the same suite is green in CI)
- **Service Line Coverage**: **99.61%** (threshold: 80%)
- **Overall Line Coverage** (`apps/api`): **98.31%** (threshold: 70%)

### 3.2 Performance Verification (NFR-1 / T-40)
- **Benchmark Target**: p95 time of the ranking function `rank()` $< 500\text{ ms}$ over 10,000 components and 5,000 keywords across 200 random searches (alternating `any` and `all` modes).
- **Result**: the test passes. It times the scoring code in process only, so database and network time are not included, and browse or detail endpoints are not measured.

### 3.3 End-to-End (E2E) & Accessibility Verification
- **Framework**: Playwright 1.63 + `@axe-core/playwright`
- **Browsers**: Chromium (Desktop Chrome profile)
- **Total E2E Scenarios**: 9 tests across 4 test specs
- **Result**: **100% Passed (9/9)**
  - `T-41`: User registration $\to$ category browsing $\to$ keyword search $\to$ component usage (completed within 3 screens).
  - `T-42`: Cataloguer login $\to$ component creation with keywords $\to$ edit metadata $\to$ delete.
  - `T-43`: Cataloguer reports overview $\to$ purge candidate filtering $\to$ atomic deletion execution.
  - `T-45`: Automated Axe accessibility scan across `/`, `/search`, `/browse`, `/login`, `/register` (zero critical or serious violations) + keyboard-only search navigation.

---

## 4. Live Demonstration Walkthrough Script

For evaluators and instructors demonstrating the running application:

### Step 1: Start Services & Seed Database
```bash
# Seed development database with notations, cataloguer, categories, and demo components
npm run db:seed -w @sccs/api

# Run local development servers (API on port 4000, Web on port 3000)
npm run dev
```

### Step 2: Public Exploration & Searching (Visitor Role)
1. Navigate to `http://localhost:3000`.
2. Inspect the home page showing connection status ("API ok", "DB ok") and quick search box.
3. Click **Browse** in the top navigation:
   - Select the `Design patterns` tree $\to$ `Behavioural patterns`.
   - Observe direct component counts and aggregated subcategory counts.
   - Click **Observer pattern class diagram** to inspect metadata, UML notation tag, and PlantUML content.
4. Click **Search** in the top navigation:
   - Enter `parser` in the keyword chip input.
   - Select match mode **Any keyword**.
   - Click **Search**: inspect the results showing `CSV parser` and `JSON tokenizer` with score badges and matched keywords.

### Step 3: User Authentication & Component Reuse (User Role)
1. Click **Register** in the top navigation.
2. Register a new user account (e.g. `alice@example.com` / `password123`).
3. Return to the search results for `parser`.
4. Click **Use this component** next to `CSV parser`:
   - Notice immediate UI confirmation ("Marked as used").
   - Notice the component's `useCount` incrementing and `queryHitNotUsedCount` decrementing.

### Step 4: Cataloguer Management & Purge Workflow (Cataloguer Role)
1. Click **Log out**, then navigate to **Login**.
2. Log in using seeded cataloguer credentials:
   - Email: `cat@sccs.local`
   - Password: `changeme123`
3. Notice the **Console** link appearing in the navigation bar.
4. Navigate to **Console $\to$ Components**:
   - Click **New component**.
   - Create a new component (e.g. `QuickSort Algorithm`, kind: `CODE`, notation: `Python`, category: `Sorting and searching`, keywords: `sort`, `quicksort`, `algorithm`).
   - Confirm redirect to detail view and presence in category listings.
5. Navigate to **Console $\to$ Reports**:
   - Inspect summary metrics: total components, breakdown by notation, most used components, and never-used components count.
6. Click **Review purge candidates** (`/console/purge`):
   - Set filters: `Used at most: 0`, `Catalogued more than: 0 days ago`.
   - Click **Find candidates**.
   - Select a candidate via checkbox, click **Purge selected**, and confirm the browser alert.
   - Confirm deletion status banner and observe removal from catalogue.
7. Navigate to **Console $\to$ Audit**:
   - Inspect the real-time immutable audit trail showing `COMPONENT_CREATE`, `KEYWORDS_UPDATE`, and `COMPONENT_PURGE` actions with timestamps and actor details.

---

## 5. Security & Engineering Best Practices

- **Zero Plaintext Credentials**: Passwords hashed with BCrypt (work factor 10); hashes excluded from all API serialization.
- **Strict Input Validation**: Every endpoint guarded by shared Zod schemas preventing parameter injection, negative limits, or overlong payloads.
- **Relational Integrity**: Foreign keys enforce cascading deletions of component keywords, search results, and usage logs when a component is deleted.
- **Cycle & Duplicate Prevention**: Postgres transactions and recursive queries prevent circular category parentage and duplicate names at root or sibling levels.
- **No Default Secret**: the JWT signing secret comes only from `JWT_SECRET`; the API refuses to issue tokens without it (T-47).
- **Fixed-Window Rate Limiting**: Brute-force protection applied to `/auth/login` and `/auth/register` (max 20 requests per 15-minute window per IP) returning HTTP `429 RATE_LIMITED` with `Retry-After` headers (T-48). The counter is in process memory, so it is not shared between serverless instances.
- **CORS Allow-List**: browsers from other origins than `WEB_ORIGIN`, `localhost` and `*.vercel.app` get no CORS headers.
- **Accessibility**: no axe violations on the five public pages, and the search flow works by keyboard alone. A full WCAG audit, the console pages and a 360 px layout were not checked.
