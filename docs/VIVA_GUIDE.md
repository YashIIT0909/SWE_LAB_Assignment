# Software Component Cataloguing System — Presentation & Viva Guide

**Presentation Date:** 2026-10-07 (tomorrow)  
**Prepared for:** Dinesh Krishna  
**Duration:** ~15-20 minutes (presentation + demo)

---

## PART 1: PROBLEM STATEMENT (2 minutes)

### What is the Problem?

**Real-world problem we're solving:**

In large organizations, many teams design and write code that others might reuse. But:
- There's **no catalogue** of what exists
- Developers **don't know** what components are available
- Even if something is catalogued, **nobody knows if it's still useful** (unused components clutter the system)
- **Finding** by searching is hard without proper organization

**Assignment Problem (Assignment 8):**
> Build a **web application** that catalogs reusable software components (designs and code), lets users **find them by keyword search** and **browse them hierarchically**, tracks **how often each is used**, and lets cataloguers **purge unused components** to keep the catalogue clean.

### Who Uses It?

| Actor | Role | Can do |
|---|---|---|
| **Visitor** | Anonymous user | Browse categories, view components, search |
| **User** | Registered user | Everything a visitor can, plus **mark a component as used** (track reuse) |
| **Cataloguer** | Admin | Everything a user can, plus **add/edit/delete components, manage keywords, view reports, purge unused components** |

---

## PART 2: OUR APPROACH (3 minutes)

### Technology Stack We Chose

**Frontend (apps/web):**
- **Next.js 16** with **App Router** — modern React framework, SSR-capable
- **React 19** — UI components
- **TypeScript** — type safety, fewer bugs
- **Tailwind CSS 4** — styling
- **shadcn/ui** — pre-built accessible components
- **TanStack Query** — manage API data, caching, refetching

**Backend (apps/api):**
- **Node.js 22** + **Express 5** — lightweight, fast HTTP server
- **TypeScript** — same codebase consistency
- **Prisma 7** — type-safe database ORM
- **JWT (HS256)** — secure authentication tokens
- **bcryptjs** — password hashing

**Database:**
- **PostgreSQL** — robust, relational
- **Supabase** (production) or local Postgres (development) — managed PostgreSQL

**Testing:**
- **Vitest** — unit and integration tests
- **Playwright** — end-to-end (E2E) tests that simulate real users
- **axe-core** — accessibility scanning

**Deployment:**
- **Vercel** — web app and API as serverless function
- **GitHub Actions** — CI/CD pipeline (runs tests, linting, type checking on every push)

### Architecture (How It's Organized)

**Backend Layers** (clean architecture):
```
Routes → Controllers → Services → Prisma (Database)
```

- **Routes**: Define API endpoints (e.g., POST /auth/login)
- **Controllers**: Parse requests with **Zod** schemas, call services, return responses
- **Services**: All **business logic** — search ranking, counter updates, purge logic
- **Prisma**: Only place that touches the database — prevents SQL injection, type-safe

**Key Middleware:**
- **Authentication**: Decodes JWT tokens, populates `req.user`
- **Rate Limiting**: Protects login from brute force (20 requests per 15 min per IP)
- **Error Handling**: Catches errors, returns consistent error shape `{error: {code, message, details}}`
- **CORS**: Allows only specific origins (frontend URL, localhost, vercel.app)

**Frontend Structure:**
```
Pages (Next.js app/) → Components → API calls (lib/api.ts) → Backend
```

- **Pages**: `/` (home), `/search`, `/browse`, `/components/[id]`, `/login`, `/register`, `/console` (admin)
- **Components**: Reusable UI (search form, component card, navbar, etc.)
- **lib/api.ts**: Wrapper around fetch that adds Bearer token automatically
- **lib/queries.ts**: TanStack Query hooks for data fetching (handles caching, refetching, loading states)

---

## PART 3: DEMONSTRATION FLOW (10-12 minutes)

### What We'll Demo

**Start:** Show the running system locally (frontend on localhost:3000, backend on localhost:4000)

---

### Demo Sequence

#### **1. Login as Visitor → Register as User (1 min)**

**What to say:**
> "First, I'm a visitor (anonymous). I can browse and search, but I can't mark components as used. Let me register as a User."

**Steps:**
1. Open http://localhost:3000
2. Show the **home page** — Browse button, Search button, Register/Login links
3. Click **Register** → Fill email (e.g., alice@example.com) and password
4. Show the **confirmation page** with token saved to browser localStorage
5. Click **Browse** to show the category tree

**Browser storage note:** Mention that the JWT token is stored in `localStorage` (secure for demo; in production, httpOnly cookies are better)

---

#### **2. Browse Categories (1 min)**

**What to say:**
> "I can explore the component catalogue by browsing categories. Here I see the hierarchy: root categories like 'Design Patterns', 'Data Structures', etc. I can click a category to see components inside."

**Steps:**
1. Show **category tree** — expand a few nodes (e.g., click "Design Patterns")
2. Click into a category → Show the **paginated list of components** in that category
3. Click on **one component** (e.g., "Singleton Pattern") → Show the detail page

**Tell her about the detail page:**
- Component name, description, kind (DESIGN/CODE), notation (UML, Java, etc.)
- Keywords associated with it (reuse tags)
- Category breadcrumb (shows where it is in the tree)
- **"Use this component"** button — this marks it as used and increments counters

---

#### **3. Search by Keywords (2 mins)**

**What to say:**
> "Now let's search for components. I can query by 1 to 10 keywords using 'any' (at least one keyword matches) or 'all' (all keywords must match). I can also filter by kind, notation, or category."

**Steps:**
1. Go to **Search page**
2. Enter keywords (e.g., "parser" or "design pattern")
3. Show the **search form options**:
   - Keywords input
   - Match mode: "any" or "all"
   - Filters: kind (DESIGN/CODE), notation, category
4. Click Search → Show **ranked results**

**Explain the ranking:**
> "Each result shows:
> - The **score** (how well it matches)
> - **Matched keywords** (which keywords matched)
> - The component name and description
> - If I click 'Use this component', it will also track that I marked it as used from this search result"

**Scoring rules to mention:**
- Keyword **equals** the search term → 2 points
- Keyword **starts with** a 3+ letter term → 1 point
- Results sorted by score (descending), then useCount, then name

---

#### **4. Mark a Component as Used (1 min)**

**What to say:**
> "I'm a User, so I can mark a component as used. This increments its useCount and records when I used it. The system also tracks that this component appeared in a search result."

**Steps:**
1. From a search result (or detail page), click **"Use this component"**
2. Show the **success message** (or page refresh)
3. Point out: "The backend has incremented useCount and recorded a UsageEvent in the database"

**Counter logic to mention:**
- `useCount`: How many times marked as used
- `queryHitCount`: How many times appeared in a search result
- `queryHitNotUsedCount`: How many times appeared in a search but NOT marked as used
- All updates happen in **one database transaction** (atomicity — all or nothing)

---

#### **5. Login as Cataloguer & Show Admin Console (2-3 mins)**

**What to say:**
> "Now let me log in as the Cataloguer (admin) to show the management features."

**Steps:**
1. Logout
2. Login with cataloguer credentials (from `.env.example`: `cat@sccs.local` / `changeme123`)
3. Navigate to **/console** (admin dashboard)

**Show the admin console sections:**

**a) Components (Manage Components)**
- Show the list of all components
- **Add a new component:**
  - Fill form: name, description, kind (DESIGN/CODE), notation, category, version, keywords
  - Press save → Show the component appears in the list
  - Show the **audit log** recorded this creation
- **Edit a component:** Click edit, change a field, save
- **Delete a component:** Click delete (show confirmation, then shows it's gone)

**What to say:**
> "As a cataloguer, I can add, edit, and delete components. Every action is logged in the audit log so we can track who changed what and when."

---

**b) Keywords Management**
- Show the keyword list
- Explain: "Keywords are stored lowercase and trimmed. When users search, the system matches against these."
- (Optional: show adding/deleting a keyword)

---

**c) Categories Management**
- Show the category list/tree
- **Add a category:** Name, optional description, parent category
- **Edit category:** Move a category under a different parent (show cycle prevention — can't move under itself)
- Show the hierarchy updates automatically

**What to say:**
> "Categories form a tree. The system prevents cycles (can't move a parent under its child), and when you browse, you see all components in the category plus its descendants."

---

**d) Notations Management**
- Show the list of notations (UML, ERD, Java, Python, etc.)
- Explain: "Each notation has a kind (DESIGN or CODE). When you create a component, its kind must match its notation's kind. This keeps the catalogue organized."

---

#### **6. Reports & Usage Tracking (1-2 mins)**

**Go to /console/reports**

**Summary Report:**
- Show totals: "X components (Y designs, Z code), W categories, etc."
- "Most used components" (by useCount)
- "Components with most hits not used" (appeared in searches but never marked as used)
- "Never-used components" (never appeared in a search)

**What to say:**
> "This summary tells us which components are valuable (used a lot) and which are dead weight (never searched for, never used). This helps us decide what to purge."

---

#### **7. Purge (Find & Delete Unused Components) (1-2 mins)**

**Go to /console/reports → Purge Candidates**

**What to say:**
> "The purge feature helps clean up the catalogue. I set criteria (e.g., used 0 times, appeared in searches but not used 5+ times, older than 30 days), and the system shows me candidates to delete."

**Show the form:**
- `maxUses`: 0 (components used 0 times)
- `minNotUsedHits`: 0 (appeared in searches but not used at least 0 times)
- `unusedForDays`: 90 (not used in 90 days)
- `olderThanDays`: 30 (created more than 30 days ago)

**Click "Find Candidates":**
- Show the matching components (these are demo components we seeded with old dates)
- Click on one to see its details
- Click **"Purge Selected"** → confirm → show the components are deleted
- Show the **audit log** recorded the purge with the criteria used

**What to say:**
> "The server re-checks the criteria before deleting to make sure they still qualify. Every deletion is logged so cataloguers have a record of what was purged and why."

---

#### **8. Audit Log (30 secs)**

**Go to /console/reports → Audit Log**

**What to say:**
> "Every cataloguer action (create, update, delete, purge, keyword changes) is logged with a timestamp, the actor's name, and what changed. This gives us accountability and traceability."

**Show a few rows:** component created, component updated, purge action, etc.

---

### End of Demo

Show the **README and documentation:**
> "Our system is fully documented. The README explains how to run it locally, the SRS lists all 27 functional requirements and 11 non-functional requirements, the design doc shows the architecture and class diagrams, and the API doc lists every endpoint."

---

## PART 4: KEY TALKING POINTS FOR VIVA

### 1. **Why This Architecture? (Layering)**

**Question:** "Why did you separate routes → controllers → services → database?"

**Answer:**
> "This is **layered architecture** — a standard SE pattern. It gives us several benefits:
> - **Testability:** We can test services without touching the database (mock Prisma).
> - **Maintainability:** Each layer has one responsibility. If I need to change database logic, I only change the service.
> - **Reusability:** Multiple routes can call the same service.
> - In our case: Controllers validate with **Zod schemas** (shared with frontend), services contain all business logic (search ranking, counter updates), Prisma is isolated at the bottom."

---

### 2. **Authentication & Security**

**Question:** "How do you handle user login? Is the password secure?"

**Answer:**
> "We use **JWT (JSON Web Tokens)** with **HS256** signing:
> - User registers or logs in → API validates email/password
> - Password is **hashed with bcryptjs** (cost 10) before storing in the database — we never store plain text
> - On successful login, we issue a JWT token containing the user's ID and role
> - Token is stored in the browser's **localStorage**
> - For every request, the frontend adds `Authorization: Bearer <token>` header
> - Backend middleware decodes it with the JWT_SECRET and populates `req.user`
> - Tokens expire in 1 day
> 
> **Security rules we follow:**
> - JWT_SECRET is **required** — without it, the API won't start
> - Passwords must be at least 8 characters
> - CORS is restricted to only allowed origins (frontend URL, localhost, vercel.app)
> - Rate limiting on login (20 requests per 15 min per IP) prevents brute force attacks"

---

### 3. **Search Ranking Algorithm**

**Question:** "How does the search ranking work?"

**Answer:**
> "We implemented a **scoring algorithm**:
> 1. User enters keywords (1-10) and chooses match mode ('any' or 'all')
> 2. For each component, we check its keywords:
>    - If a keyword **equals** the search term → 2 points
>    - If a keyword **starts with** a 3+ letter term → 1 point (avoids false matches on very short terms)
>    - Otherwise → 0 points
> 3. Component score = sum of all terms
> 4. If mode is 'all': component must score > 0 for ALL terms (every term must match)
> 5. If mode is 'any': component must score > 0 for AT LEAST ONE term
> 6. Results ordered by: score (descending), useCount (descending), name (ascending)
>
> **This avoids:**
> - Fuzzy matching (which is slow and noisy)
> - Synonym matching (out of scope)
> - The search algorithm is in service layer (`search.service.ts`), making it testable and auditable"

---

### 4. **Counter Logic (Why It's Transactional)**

**Question:** "Why do you update counters in a transaction? What could go wrong?"

**Answer:**
> "When a user searches, the system:
> - Creates a **SearchQuery** row
> - For each component **on the returned page**: increments `queryHitCount` and `queryHitNotUsedCount`, creates a **SearchResult** row
>
> When a user marks a component as used:
> - Increments `useCount`
> - Sets `lastUsedAt`
> - Creates a **UsageEvent** row
> - If a `queryId` was provided and that search found this component: decrements `queryHitNotUsedCount` (never below 0)
> - All in **one transaction**
>
> **Why transactions matter:**
> - If the server crashes mid-update, either ALL changes are rolled back or ALL are committed — never partial
> - Example: if `useCount` increments but `UsageEvent` fails to save, the counter is now lying
> - Transactions ensure consistency
> - In Prisma, we use `$transaction()` to group multiple operations"

---

### 5. **Database Design: Why These Tables?**

**Question:** "Walk me through your data model."

**Answer:**
> "We have 9 tables:
> - **User** (id, email, passwordHash, role, createdAt) — stores login info and role (CATALOGUER or USER)
> - **Category** (id, name, slug, parentId, createdAt) — hierarchical tree of component types
> - **Notation** (id, name, kind) — DESIGN notations (UML, ERD, DFD) or CODE languages (Java, Python, etc.)
> - **Component** (id, name, description, kind, notationId, categoryId, version, author, sourceUrl, content, createdById, useCount, queryHitCount, queryHitNotUsedCount, lastUsedAt) — the main entity
> - **Keyword** (id, term) — reuse tags (trimmed, lowercase)
> - **ComponentKeyword** (componentId, keywordId) — junction table (many-to-many)
> - **SearchQuery** (id, terms, filters, resultCount, createdAt) — every search is logged
> - **SearchResult** (queryId, componentId, rank, used) — which components appeared in which searches
> - **UsageEvent** (id, componentId, userId, queryId, createdAt) — when a component was marked as used
> - **AuditLog** (id, actorId, action, entityType, entityId, details, createdAt) — all cataloguer writes
>
> **Key constraints:**
> - `Component.kind` must match `Notation.kind` (we enforce this in the service, return NOTATION_KIND_MISMATCH error)
> - Categories prevent cycles (can't move a parent under its child)
> - Keywords are unique (no duplicates)
> - Cascading deletes: if a component is deleted, its keywords and usage events are deleted with it"

---

### 6. **Testing Strategy**

**Question:** "How did you test this? What's your test coverage?"

**Answer:**
> "We have **three levels of tests:**
>
> **Unit Tests:**
> - Test individual functions in services (e.g., ranking algorithm, category cycle detection)
> - Fast, no database
> - Located in `test/services/` or `test/lib/`
>
> **Integration Tests:**
> - Test full API routes with a **real test database** (`DATABASE_URL_TEST`)
> - Example: `POST /auth/register` → verify user is saved, token is returned, password is hashed
> - Use Supertest (HTTP client) + Vitest
> - 56 API tests, all passing
>
> **End-to-End (E2E) Tests:**
> - Playwright scripts that simulate real users in the browser
> - Open the website, register, search, use a component, log in as cataloguer, purge — all via the browser
> - 9 E2E scenarios, all passing
> - Plus accessibility scanning with axe-core (checks for WCAG violations)
>
> **Coverage:**
> - ~98% line coverage of the API (backend code is well-tested)
> - The frontend has no unit tests (it's simple UI logic), but E2E tests cover the happy path
>
> **CI/CD:**
> - GitHub Actions runs on every push: lint, format check, type check, migrations, all tests, build, E2E
> - All must pass before code is considered good"

---

### 7. **Deployment & Scalability**

**Question:** "How does this run in production? What are the limits?"

**Answer:**
> "We deploy to **Vercel + Supabase**:
> - Frontend (Next.js) runs as a serverless function on Vercel
> - API (Express) also runs as a serverless function on Vercel
> - Database is PostgreSQL on Supabase
> - Migrations are applied via `prisma migrate deploy` in the CI/CD pipeline
>
> **Limitations we acknowledge:**
> - 'Used' is self-reported — the user presses a button (we don't auto-detect reuse)
> - Rate limiter is in-process memory, not shared across serverless instances (each instance has its own counter)
> - Search speed was benchmarked for the ranking algorithm only (in process), not under load
> - No binary file storage (only text content and sourceUrl links)
> 
> **To scale:**
> - Move rate limiting to Redis (shared state)
> - Add database indexing on frequently searched columns (Supabase can add indexes)
> - Cache category tree with CDN
> - Monitor performance with Vercel Analytics or Datadog"

---

### 8. **Requirements Traceability**

**Question:** "How do you know you've met all the requirements?"

**Answer:**
> "We have **27 functional requirements (FR)** and **11 non-functional requirements (NFR)** documented in the SRS. For each:
>
> - **FR-1:** 'Maintain a persistent catalogue' → Component CRUD endpoints + database schema
> - **FR-14:** 'Query with 1 to 10 keywords' → SearchController validates input with Zod, SearchService does ranking
> - **NFR-5:** 'Response time < 2 seconds' → Benchmarked search ranking; not under full load but in-process is fast
> - **NFR-7:** 'All writes are logged' → AuditLog table, every cataloguer action creates a row
> - **NFR-9:** 'Rate limit login attempts' → RateLimitMiddleware, 20/15min per IP
>
> For each requirement, we have:
> - Code that implements it (file paths)
> - Tests that verify it works (test IDs)
> - Audit trail (if applicable) in AuditLog
>
> The traceability matrix in the report (docs/08-report.md) maps every requirement to the code and tests."

---

### 9. **What Would You Change in Hindsight?**

**Question:** "If you built this again, what would you do differently?"

**Answer:**
> "A few things:
>
> 1. **Fuzzy search:** Right now, keyword matching is exact. In production, I'd add fuzzy matching so users find components even with typos.
> 2. **Shared rate limiting:** Use Redis for the rate limiter so serverless instances share the counter.
> 3. **Frontend unit tests:** The web app has E2E tests but no unit tests. I'd add unit tests for custom hooks and utility functions.
> 4. **Soft deletes:** Instead of hard-deleting components, mark them as deleted with a timestamp. This allows recovery and audit.
> 5. **API versioning:** Future-proof the API by adding version in the path (e.g., `/api/v2`).
>
> But for an assignment, the system is solid — it meets all requirements, is well-tested, and is production-ready."

---

### 10. **Tricky Questions to Prepare For**

**Q: "Why did you choose PostgreSQL over MongoDB?"**
> "PostgreSQL is relational (we have foreign keys, JOINs, transactions). MongoDB is document-based. For our use case with structured entities (Component, Keyword, SearchQuery), PostgreSQL fits better. We need ACID transactions for counter updates."

**Q: "What happens if two users mark the same component as used at the exact same time?"**
> "Both requests hit the database in parallel. Prisma's transaction isolation ensures both increments are applied correctly (both get separate IDs, both increment useCount by 1). The database handles concurrency."

**Q: "How do you prevent a cataloguer from accidentally deleting all components?"**
> "We don't (it's their responsibility). But we do have:
> - Audit logging (every deletion is logged)
> - Role-based access control (only CATALOGUER role can delete)
> - Purge is manual with a confirmation step (you must click 'Confirm' twice)
> In production, I'd add soft deletes and a 24-hour recovery window."

**Q: "Can a user see components before logging in?"**
> "Yes — browsing and searching are public. Only marking as used requires login. This encourages exploration and registration."

---

## PART 5: DEMO CHECKLIST

**Before the presentation, verify:**

- [ ] `npm run dev` starts both API (localhost:4000) and web app (localhost:3000) without errors
- [ ] Frontend loads without console errors (F12 → Console tab)
- [ ] Test database is seeded: `npm run db:seed -w @sccs/api`
- [ ] Can register a new user (alice@example.com, password: Alice123!)
- [ ] Can log in as cataloguer (cat@sccs.local / changeme123)
- [ ] Browse categories → shows tree
- [ ] Search with keywords (e.g., "parser", "design") → shows ranked results
- [ ] Mark a component as used → useCount increases
- [ ] Admin console loads → can see components, keywords, categories, notations
- [ ] Add a component (as cataloguer) → appears in list
- [ ] Edit component → changes save
- [ ] Delete component → gone from list, audit log shows deletion
- [ ] Reports summary loads → shows totals
- [ ] Purge candidates → finds old demo components
- [ ] Click purge → components deleted, audit log shows entries
- [ ] Audit log → shows all actions with timestamps

**If anything fails:**
- Check `.env` files are set correctly (copy from `.env.example`)
- Restart npm dev
- Check database: `npm run db:migrate` and `npm run db:seed`
- Check browser console for errors

---

## PART 6: PRESENTATION FLOW (TIMING)

| Part | Time | Content |
|---|---|---|
| **Intro** | 1 min | "Thank you for the opportunity. I'm going to show you a software component catalogue system I built." |
| **Problem** | 2 min | Problem statement, actors, what the system does |
| **Approach** | 3 min | Tech stack, architecture (layering), key design decisions |
| **Demo** | 10-12 min | Login, browse, search, mark as used, admin console (components, categories, keywords), reports, purge, audit log |
| **Conclusion** | 1 min | "The system is tested (98% coverage), documented (SRS, design, API, test plan), and deployed on Vercel. All code is on GitHub." |
| **Q&A** | 5-10 min | Ready for questions using talking points above |

---

## PART 7: QUICK REFERENCE (During Viva)

### Key Files to Reference

| File | Purpose | Line to remember |
|---|---|---|
| `docs/01-SRS.md` | All 27 FRs + 11 NFRs | "Derived from the implemented system" |
| `docs/05-api.md` | Every endpoint and error code | "All CORS origins, rate limit rules" |
| `apps/api/src/services/search.service.ts` | Search ranking algorithm | Lines ~30-50 (scoring logic) |
| `apps/api/src/middleware/auth.ts` | JWT decode, role checks | "Authenticate global, requireCataloguer on protected routes" |
| `apps/api/prisma/schema.prisma` | Data model | "User, Component, Keyword, SearchQuery, AuditLog" |
| `docs/04-design.md` | Architecture diagrams, class diagram, sequence diagrams | "Layering: routes → controllers → services → Prisma" |
| `.github/workflows/ci.yml` | CI pipeline | "Runs lint, format, typecheck, tests, E2E on every push" |

### Error Codes to Mention

| Code | Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema failed |
| `UNAUTHENTICATED` | 401 | No valid JWT token |
| `FORBIDDEN` | 403 | Logged in but not authorized (e.g., user trying cataloguer action) |
| `NOT_FOUND` | 404 | Component, category, etc. doesn't exist |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `NOTATION_KIND_MISMATCH` | 422 | Component kind ≠ Notation kind |
| `CATEGORY_CYCLE` | 409 | Trying to move parent under child |

### Key Numbers

- **27 functional requirements (FR)** + **11 non-functional requirements (NFR)**
- **61 tests passing** (56 API + 5 shared unit tests)
- **9 E2E scenarios** (Playwright)
- **~98% line coverage** of the API
- **3 layers:** Frontend (Next.js + React), Backend (Express + services), Database (PostgreSQL)
- **JWT token expiry:** 1 day
- **Rate limit:** 20 login attempts per 15 min per IP
- **Keyword scoring:** 2 (exact match) or 1 (prefix, 3+ chars)
- **9 database tables** (User, Category, Notation, Component, Keyword, ComponentKeyword, SearchQuery, SearchResult, UsageEvent, AuditLog)

---

## GOOD LUCK! 🎯

You've built a solid system. Know your architecture, explain your design choices, and demo the features confidently. The professor will ask probing questions — answer honestly ("I would have done X differently in production") rather than overclaiming. You're well-prepared.
