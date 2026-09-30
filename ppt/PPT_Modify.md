# PPT_Modify.md: how to update the SCCS presentation

For the assistant that edits the deck. Attach `Software_Component_Cataloguing_System.pptx` together
with this file. The deck was written before the system was finished, and it contradicts the real system
in many places. This file says what is wrong, what every slide must say instead, the new look, and
which images will be added by hand.

## 0. Ground rules (read first)

1. **Facts come only from section 1 of this file.** Do not invent numbers, features, versions or
   technologies. If a slide needs a fact that is not here, leave a visible `[TODO: ...]` marker and list it
   in your final message.
2. **Images are added by the owner, by hand.** Do not generate pictures. Wherever section 6 or 7 lists an
   image, put a placeholder frame of the stated size: a rounded rectangle, light fill, dashed border,
   with the text `INSERT: <file name>` centred inside. The owner replaces it later. Use PowerPoint
   shapes, not fake pictures.
3. **Keep 16:9, 13.333 in x 7.5 in.** Keep at least 0.5 in margin. No text may overflow or be cut off.
4. **Editing approach:** the current deck has no images and every element is a loose text box or shape
   (named `Text 0`, `Text 1`, ...). Rebuilding each slide from scratch in the new design is easier and
   cleaner than editing the old shapes. Keep the slide order and count from section 3.
5. **Speaker notes:** add two or three plain sentences to every slide (the owner has a viva and needs
   something to say). Use the "Notes" lines in section 5 as the base.
6. **When finished,** reply with: the list of slides changed, every `[TODO]` you left, every place you
   were unsure of, and confirmation that nothing from section 8 (the "never say" list) is in the deck.

## 1. Facts about the system (single source of truth)

**What it is.** A web catalogue of potentially reusable software components. A component is a
**design** (UML, ERD, Structured Design, DFD) or **code** (Java, Python, C, C++, JavaScript,
TypeScript). Components have keywords, sit in a hierarchical category tree, and are found by keyword
search or by browsing. The system counts how often each component is used, and how often it shows up in
a search without being used, so a cataloguer can purge unused components.

**Course and project.** Software Engineering, Assignment 8 (problem: Software Component Cataloguing),
IIT (ISM) Dhanbad, September 2026. Deadline 1 October 2026. Deliverables: SRS (functional and
non-functional requirements), UML use case and class diagrams, this PPT, and the working website.
The team project was taken over and completed by one maintainer.

**Actors.** Visitor (not logged in): browse, view, search. User: also marks a component as used
(needs login). Cataloguer: also maintains components, keywords, categories and notations, views reports
and the audit log, purges. A User is a logged-in Visitor and a Cataloguer is a User with more rights.
Registration always creates a User. Cataloguer accounts are created by a seed script, never through the
website.

**Data.** Seed data: 10 notations (4 design, 6 code), 10 categories in three trees (Design patterns >
Creational / Structural / Behavioural patterns; Data processing > Parsing / Sorting and searching; Web
development > UI widgets / Authentication), 14 demo components, plus 3 old unused components for the
purge demo. Example: "Observer pattern class diagram" (UML) sits in Design patterns > Behavioural
patterns; "JWT auth middleware" (TypeScript) sits in Web development > Authentication.

**Search.** 1 to 10 keywords, match mode "any" or "all", optional filters: kind, notation, category
(with or without subcategories). A keyword equal to the search term scores 2. A keyword that starts
with the term scores 1, only when the term has 3 or more characters. Results are ordered by score, then
times used, then name. Each result shows its matched keywords and score. There is no fuzzy matching and
no synonym handling.

**Counters** (per component): `useCount`, `queryHitCount`, `queryHitNotUsedCount`, `lastUsedAt`.
- A search adds 1 to `queryHitCount` and `queryHitNotUsedCount` for each component on the **returned
  page** only. The search and its counters are saved in one database transaction.
- "Use this component" (login needed) adds 1 to `useCount`, sets `lastUsedAt`, and records a usage event.
  If the use came from a search result that was not yet used, that result is marked used and
  `queryHitNotUsedCount` goes down by 1, never below 0. Using the same result twice reduces it once.

**Purge.** Manual, started by a cataloguer. Criteria with defaults: used at most `maxUses` (0) times,
at least `minNotUsedHits` (0) hits not used, not used for `unusedForDays` (90) days, created more than
`olderThanDays` (30) days ago. The cataloguer reviews the candidate list, selects some, and confirms.
The server checks the criteria again and deletes only what still qualifies, and writes one audit entry
per deleted component. **There is no scheduler, daemon or cron job.**

**Architecture.** Browser, Next.js web app, Express API, PostgreSQL. Deployed on Vercel (web app and
API as a serverless function) with Supabase used only as managed PostgreSQL. Backend layers in `apps/api`:
routes, middleware, controllers, services, Prisma. Only services access the database. A shared package
with zod schemas is used by both apps for validation. Categories use recursive SQL (CTE) for breadcrumbs
and descendants. No Docker, no microservices, no message queue.

**Technology (exact).** Web: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui,
TanStack Query 5. API: Node.js 22, Express 5, TypeScript, zod 4, Prisma 7, bcryptjs, jsonwebtoken (JWT,
HS256, one day). Database: PostgreSQL (16 in CI, Supabase in production). Tests: Vitest 4, Supertest,
Playwright 1.63 with axe-core. Tooling: ESLint, Prettier, GitHub Actions CI, npm workspaces monorepo
(`apps/web`, `apps/api`, `packages/shared`).

**Requirements.** 27 functional requirements (FR-1 to FR-27) and 11 non-functional (NFR-1 to NFR-11),
in `docs/01-SRS.md`. Their content is in slides 3 and 4 below.

**Testing (exact numbers, last run 30 Sep 2026).** 5 unit tests (shared package) + 56 unit and
integration tests (API, Vitest + Supertest against a real PostgreSQL test database) = **61**, all passing.
**9** Playwright end-to-end scenarios (browse-search-use, cataloguer lifecycle, purge flow, 5 axe
accessibility scans, 1 keyboard-only search), all passing. Line coverage of the API **98.31%**
(services 99.61%; thresholds 70% and 80%). GitHub Actions CI is green (lint, format check, type check,
migrate, tests, web build, seed, end-to-end). 48 numbered test cases (T-01 to T-48) traced to
requirements in `docs/06-test-plan.md` and `docs/08-report.md`. Techniques: equivalence classes and
boundary values (search keywords 0/1/10/11, term length 0/1/50/51, page size 0/1/50/51, purge thresholds
exactly at the boundary), branch coverage on the ranking and use logic, a forced failure inside a
transaction (nothing is half-written), role checks, bcrypt check, JWT-secret check, rate-limit check.

**Not tested or not done (be honest about these).** Web app has no unit tests. Accessibility was scanned
on 5 public pages only (not the console); a 360 px layout was not tested. Performance test times only the
ranking function in memory (10,000 components, 5,000 keywords, 200 searches, 95th percentile under
500 ms), not the full request. No load or concurrency test.

## 2. What is wrong in the current deck

| Slide | Problem | Severity |
|---|---|---|
| 1 | "APPROVED" stamp, "INDEX ID CATALOGUE-CORE-2025", "SPEC 4.02 // ARCHIVE" are invented; year is wrong; "Multi-Facet Inverted Keyword Index" is not what was built; no name, course or date. | High |
| 2 | Lists 3 languages only (system has 6); the example path `/Root/Security/Authentication/Design/UML/Tokens` puts the notation inside the category path, which is not how it works; claims about lookup speed are not measured. | Medium |
| 3 | Wrong actors ("Catalogue User" is read-only); says purge is an **automated daemon**; "Maintain usage metrics" drawn as a use case; hand-drawn diagram, not UML. | High |
| 4 | Class model is invented: `UsageStatistic`, `ReuseInfo`, `Query`, abstract `User` with two subclasses, `Keyword.weight` do not exist. Multiplicities are wrong. | High |
| 5 | Has a `:ComponentRepo` layer (there is none); keywords attached in a separate step (they are saved with the component in one transaction); claims counters are updated **asynchronously** (they are synchronous, in the same transaction). | High |
| 6 | DFD has 5 processes and 4 stores; the project's own DFD has 7 processes and 8 stores (section 5, slide A2). | Medium |
| 7 | "Scheduled daemon / cron: purgeUnused()" is false; "fuzzy keyword queries" is false; "checkout event" is not how use works; "engine maps into the tree ... inheritance" is invented; "file packages" (components store text content and a source URL). | High |
| 8 | Entire stack is wrong: Spring Boot, Java 17, Maven, Docker, JUnit, React 18.2, Node 20, Alpine are not used. | High |
| 9 | Claims that are not implemented or tested: trees deeper than 12 levels, offline cache recovery, cursor paging, concurrent-purge races, fault-injection suites. | High |
| 10 | Screen list does not match the site (no "Dashboard" with growth rates, no "export specs", no "copy code"); real screens differ. | Medium |
| 11 | "Distributed fallacies" mitigations are mostly not implemented (retries with circuit breaker, keyset pagination, async aggregations, micro-endpoints). Limitations are incomplete. | High |
| all | No requirements (FR/NFR) slide, no demo screenshots, no architecture diagram, no real test numbers. | High |

## 3. New slide list

The deck goes from 11 to 16 main slides plus 2 appendix slides.

| # | Slide | Based on old slide |
|---|---|---|
| 1 | Title | 1 |
| 2 | Problem and scope | 2 |
| 3 | Functional requirements | new |
| 4 | Non-functional requirements | new |
| 5 | Use case model | 3 |
| 6 | Domain class model | 4 |
| 7 | Architecture | new |
| 8 | Technology stack | 8 |
| 9 | How it works | 7 |
| 10 | Sequence diagrams | 5 |
| 11 | Screens and roles | 10 |
| 12 | Demo: visitor and user | new |
| 13 | Demo: cataloguer console | new |
| 14 | Testing and verification | 9 |
| 15 | Limitations and future work | 11 |
| 16 | Thank you / questions | new |
| A1 | Appendix: backend class diagram | new |
| A2 | Appendix: data flow diagrams | 6 |

Delete the old "Integration Fallacies" slide content. If the course requires that framing, ask the
owner; do not keep any mitigation that section 8 forbids.

## 4. New design

The old look (orange `FF5A0F` accent, uppercase Courier labels, "spec sheet" style) goes away.

**Palette** (hex, no `#` in code). One dominant colour, one sharp accent.

| Role | Hex | Use |
|---|---|---|
| Deep teal | `0B3C49` | Dominant. Backgrounds of slides 1, 16 and section headers; dark cards |
| Teal | `1F7A8C` | Secondary. Icons, chart bars, table headers, links |
| Mist | `E8F3F2` | Card and panel fill on light slides |
| White | `FFFFFF` | Background of content slides |
| Amber | `F4A62A` | The one accent: key numbers, badges, highlights. Use sparingly |
| Ink | `10262B` | Body text on light backgrounds |
| Muted | `5A7177` | Captions and secondary text |
| Line | `CFE0E0` | Thin borders, table lines |

Dark slides (1, 16): deep teal background, white text, amber accent. Content slides: white background,
ink text, mist cards. Keep contrast high: never amber text on white, never muted text on teal.

**Fonts** (all safe in PowerPoint): titles **Cambria** bold 34 to 40 pt; body **Calibri** 16 pt (tables
and dense cards 12 to 14 pt, nothing smaller than 12 pt); captions Calibri 12 pt muted; endpoint and
code tokens (`POST /search`) **Courier New** 13 pt.

**Motif (repeat on every content slide):** rounded-rectangle cards (corner radius about 0.12 in, mist
fill, very soft shadow) and a small icon in a teal circle at the start of each card heading. Numbered
steps use amber circles with dark text.

**Do not use:** accent lines under titles, coloured bars or stripes along slide or card edges, centred
body paragraphs, the same layout on consecutive slides, text-only slides. Left-align text. Titles are
sentences that state the point (for example "Purge is manual, not scheduled"), not one-word labels.

**Layout rhythm.** Vary: two columns (text left, picture right), icon-and-text rows, 2x2 or 2x4 card
grids, big-number callouts, a table, a full-width diagram. Gaps between blocks 0.3 in. Footer: small
muted text bottom-left "SCCS · Software Engineering · Assignment 8" and the slide number bottom-right,
on content slides only.

## 5. Slide-by-slide content

Text in quotes is final wording. `[IMG ...]` is an image frame to leave empty (section 6 and 7).

### Slide 1. Title (dark)

- Title: "Software Component Cataloguing System"
- Subtitle: "A searchable catalogue of reusable design and code components, with usage tracking to find and
  purge the ones nobody uses."
- Three fact chips: "10 notations: 4 design, 6 code" / "Keyword search with ranking" / "Usage counters and
  purge".
- Meta: "Software Engineering · Assignment 8 · IIT (ISM) Dhanbad · September 2026"
- Presenter: `[TODO: name and admission number]`, `[TODO: course code, NCSC301 or lab code]`
- `[IMG hero.png]` right side, 5.5 x 5.5 in, transparent PNG (section 7, I1).
- Remove: "ACADEMIC SUBMISSION", "SPEC 4.02", "ARCHIVE", "INDEX ID", "APPROVED", "CATALOGUE-CORE-2025",
  "Inverted Keyword Index".
- Notes: "This is the system I completed for Assignment 8: a catalogue of reusable designs and code,
  built as a web application."

### Slide 2. Problem and scope (light)

- Title: "Reuse fails when components cannot be found"
- Three numbered points (amber number circles):
  1. **Too many to browse.** A flat list stops working, so components go in a category tree.
  2. **Two kinds of component.** Designs (UML, ERD, Structured Design, DFD) and code (Java, Python, C, C++,
     JavaScript, TypeScript) live in one catalogue.
  3. **Unused components pile up.** The system counts uses, and searches that were not followed by a use,
     so a cataloguer can purge.
- Right side figure, drawn with shapes: "Component" splits into "Design" (UML, ERD, Structured Design,
  DFD) and "Code" (Java, Python, C, C++, JavaScript, TypeScript). Below it, a category example:
  "Design patterns > Behavioural patterns > Observer pattern class diagram" and
  "Web development > Authentication > JWT auth middleware". Caption: "Notation and category are separate
  properties of a component."
- `[IMG problem.png]` optional, 3 x 3 in, section 7 I2, only if it fits.
- Notes: "The problem statement asks for a catalogue, keyword search, hierarchy, and counters to help
  purge."

### Slide 3. Functional requirements (light)

- Title: "27 functional requirements in 8 groups"
- Eight cards (2 rows x 4), each: icon, heading, one line, and the IDs in muted text.
  1. **Components and notations**: create, edit, delete; design or code; notation kind must match. FR-1, 2,
     4 to 10
  2. **Keywords**: keyword sets per component; suggestions while typing. FR-11, 16
  3. **Accounts and access**: register as User, log in with JWT; only cataloguers write. FR-12, 13
  4. **Search**: 1 to 10 keywords, any or all, ranked, filters. FR-14, 15
  5. **Usage tracking**: "Use" button; hit and hit-not-used counters. FR-17, 18
  6. **Reports, purge, audit**: summary, candidates, purge with re-check, audit log. FR-19 to 22
  7. **Categories**: tree of any depth, no cycles, delete with reassign. FR-23, 24
  8. **Browsing**: tree, details, filtered lists, sorting. FR-3, 25 to 27
- Footer note: "Full list with IDs: SRS, section 2."
- Notes: "Each requirement has an ID and traces to a use case and a test."

### Slide 4. Non-functional requirements (light)

- Title: "11 non-functional requirements, each with evidence"
- Table (teal header, 12 to 13 pt): columns **Category / Requirement / Evidence**.

| Category | Requirement | Evidence |
|---|---|---|
| Performance (NFR-1) | Ranking 10,000 components with 5,000 keywords: 95th percentile under 500 ms (ranking only) | Benchmark T-40 |
| Security (NFR-2) | Passwords bcrypt-hashed, never returned; JWT secret only from environment | T-44, T-47 |
| Security (NFR-3) | Role checks on the server for every write and report | T-06, T-25 |
| Security (NFR-10) | 20 login or register requests per IP per 15 minutes | T-48 |
| Security (NFR-11) | CORS allow-list for browser origins | Checked by hand |
| Validation (NFR-4) | Shared zod schemas; fixed error shape; no stack traces | T-09, T-20 |
| Usability (NFR-5) | Core tasks in 3 screens; keyboard use; no axe violations on 5 public pages | E2E T-41, T-42, T-45 |
| Reliability (NFR-6) | `/health` reports API and database status | T-01 |
| Data integrity (NFR-8) | Counters and cascades atomic; never negative | T-26, T-11, T-24 |
| Maintainability (NFR-7) | Strict TypeScript, layers, at least 80% service coverage, CI | CI, coverage gate |
| Portability (NFR-9) | Node 22, configuration by environment variables | Windows and Linux CI |

- Add a small amber callout beside the table: "NFR-1 measures the ranking code only, not the network."
- Notes: "I only claim what I can show; the right column says how each one is checked."
- `[IMG shield.png]` optional, 2.5 x 2.5 in, section 7 I3, top right.

### Slide 5. Use case model (light)

- Title: "3 actors, 14 use cases"
- Left: `[IMG use-case.png]`, frame 4.5 in wide x 6.1 in tall (image is 1744 x 2352 px, aspect 0.74).
- Right: three actor cards.
  - **Visitor**: browse categories, view components, search, register or log in.
  - **User** (a logged-in Visitor): also **use** a component.
  - **Cataloguer** (a User with more rights): add, edit, delete components; associate keywords; manage
    categories and notations; view report and audit log; purge unused components.
- Small legend: dashed arrow = extend (optional extra behaviour); hollow triangle = generalisation.
  "Use component extends Query and View details; View details extends Query and Browse; Associate
  keywords extends Add and Edit."
- Notes: "There is no include relationship; every use case can be completed on its own."

### Slide 6. Domain class model (light)

- Title: "The domain model: 10 classes from the database schema"
- Left: `[IMG class-domain.png]`, frame 7.0 in wide x 6.2 in tall (image 2612 x 2313, aspect 1.13).
- Right: four callouts.
  - **Association classes:** `SearchResult` (rank, used) links a search to a component; `ComponentKeyword`
    links component and keyword.
  - **Aggregation:** a category holds sub-categories, and they survive when the parent is removed
    (they are reassigned).
  - **Composition:** usage events belong to a component and are deleted with it.
  - **Rules:** notation kind must equal component kind; a category cannot move under itself.
  - "No inheritance: Role is an attribute of User."
- Notes: "Counters live on Component; every use also creates a UsageEvent row."

### Slide 7. Architecture (light)

- Title: "A web app, an API and a database, in clear layers"
- Left diagram (shapes, left to right): **Browser** > **Next.js web app** (Vercel) > **Express API**
  (`/api/v1`, Vercel serverless) > **PostgreSQL** (Supabase). Label the arrows "HTTPS", "JSON + Bearer
  token", "Prisma".
- Right: vertical stack "Inside the API": Routes > Middleware (auth, rate limit, errors) > Controllers
  (parse input with zod) > Services (all business rules and transactions) > Prisma > PostgreSQL. Beside
  it: a small box "packages/shared: zod schemas used by the web app and the API".
- Callout: "Only services touch the database."
- Notes: "The web app never touches the database; the API is the only path to the data."

### Slide 8. Technology stack (light)

- Title: "One language end to end: TypeScript"
- Five cards with icons:
  1. **Web**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, TanStack Query
  2. **API**: Node.js 22, Express 5, zod 4, JWT (HS256) and bcrypt
  3. **Data**: PostgreSQL (Supabase in production), Prisma 7, recursive SQL for category paths
  4. **Quality**: Vitest, Supertest, Playwright with axe, ESLint, Prettier, GitHub Actions
  5. **Deploy**: Vercel for web and API, npm workspaces monorepo
- Left column "Why": "Shared validation schemas between web and API" / "A relational database for
  hierarchy and transactions" / "Everything checked on every push by CI".
- Notes: "Supabase is used only as managed PostgreSQL; authentication is our own API."

### Slide 9. How it works (light)

- Title: "From cataloguing to purge: five steps and four counters"
- Five numbered cards in a row or a flow (amber number circles):
  1. **Log in.** JWT, valid one day. Cataloguer accounts come from the seed script.
  2. **Catalogue.** Pick kind, notation, category, keywords, optional source URL and content. Notation kind
     must match. An audit row is written.
  3. **Search.** 1 to 10 keywords, any or all. Exact keyword = 2 points, prefix (3+ letters) = 1. For the
     components on the returned page: hits +1 and hits-not-used +1, in one transaction.
  4. **Use.** "Use this component" (login): uses +1, last used set. If it came from a search result not
     yet used: hits-not-used -1, never below 0.
  5. **Purge.** Cataloguer sets criteria, reviews candidates, confirms. The server checks again and
     deletes; one audit entry each. **Manual, no scheduler.**
- Side box "The counters": `useCount`, `queryHitCount`, `queryHitNotUsedCount`, `lastUsedAt`.
- Optional small images on steps 3 and 5 (`search.png`, `purge.png`, I4 and I5), 1.2 x 1.2 in.
- Notes: "A component shown many times but never used is the purge candidate this design is built to find."

### Slide 10. Sequence diagrams (light)

- Title: "Two flows: add a component, search then use"
- Two panels side by side, each an image frame of 6.0 x 5.2 in: `[IMG seq-add.png]` and
  `[IMG seq-search-use.png]` (these images do not exist yet: see section 6).
- Under each, a caption with the messages so they can be redrawn (participants and steps):
  - **Add component.** Cataloguer > Web console > ComponentController > ComponentService > PostgreSQL.
    Steps: submit form; `POST /components` with token; authenticate, require cataloguer, validate with zod
    (keywords trimmed, lowercased); check notation kind and category; one transaction: insert the
    component with its keywords, write the audit row; `201` with the component.
  - **Search then use.** User > Web app > SearchController > SearchService > (ComponentService for the
    category filter) > PostgreSQL; then SearchController > UsageService. Steps: `POST /search`; validate;
    find candidates, score, order, take the page; one transaction: save the query and results, hits +1 on the
    page; return `queryId` and results. Then `POST /components/:id/use` with the token and `queryId`; one
    transaction: mark the result used, hits-not-used -1, uses +1, usage event; return the counters.
- Notes: "Both flows are single transactions, so a failure leaves nothing half-written."

### Slide 11. Screens and roles (light)

- Title: "Public pages for everyone, a console for the cataloguer"
- Two tables side by side.

| Public screen | Route | What you can do |
|---|---|---|
| Home | `/` | Search box, API and database status |
| Search | `/search` | Keywords, any or all, filters (kind, notation, category), scores, **Use** |
| Browse | `/browse` | Category tree, breadcrumb, component list, sort, subcategories |
| Component | `/components/[id]` | Details, keywords, counters, content, **Use** |
| Login, Register | `/login`, `/register` | Log in; register as User |

| Cataloguer screen | Route | What you can do |
|---|---|---|
| Reports | `/console` | Totals, top used, top not used, never used |
| Components | `/console/components` | List, create, edit, delete, keyword chips |
| Categories | `/console/categories` | Create, rename, move, delete with reassign |
| Notations | `/console/notations` | List and add notations |
| Purge | `/console/purge` | Criteria, candidates, confirm |
| Audit | `/console/audit` | Change history, filter by action |

- Note: "Use needs a login. The console is for cataloguers only."
- Notes: "The same site adapts to the role: visitors, users and cataloguers see different menus."

### Slide 12. Demo: visitor and user (light)

- Title: "Demo: find a component and use it"
- Three screenshot frames in a row, each 4.0 x 2.6 in with a numbered caption underneath:
  1. `[IMG shot-search.png]` "Search 'parser', any keyword: results with score and matched keywords"
  2. `[IMG shot-detail.png]` "Open a result: details and counters; press Use"
  3. `[IMG shot-browse.png]` "Browse the tree: Design patterns > Behavioural patterns"
- Below: one line: "Counters change: hits-not-used goes down when the result is used."
- Notes: "Demo order: search, open, use, then show the counters change."

### Slide 13. Demo: cataloguer console (light)

- Title: "Demo: the cataloguer keeps the catalogue clean"
- Four frames in a 2 x 2 grid, each 5.8 x 2.7 in with captions:
  1. `[IMG shot-console-components.png]` "Add a component with keyword chips"
  2. `[IMG shot-reports.png]` "Reports: totals, top used, never used"
  3. `[IMG shot-purge.png]` "Purge: 3 old unused components found with the default criteria"
  4. `[IMG shot-audit.png]` "Audit log: every change recorded"
- Notes: "Purge is deliberate: criteria, review, confirm, and the server checks again."

### Slide 14. Testing and verification (light)

- Title: "61 automated tests, 9 end-to-end scenarios, CI green"
- Four big-number callouts (amber numbers): **61** unit and integration tests; **9** end-to-end
  scenarios; **98%** line coverage of the API; **48** numbered test cases traced to requirements.
- Left column "Levels": Unit (shared schemas, ranking); Integration (API with Supertest against a real
  PostgreSQL); End-to-end (Playwright: 3 user journeys, 5 axe scans, keyboard search); Performance
  (T-40, ranking only).
- Middle column "Techniques": Black-box: equivalence classes and boundary values (keywords 0, 1, 10, 11;
  term length 0, 1, 50, 51; page size 0, 1, 50, 51; purge thresholds exactly at the boundary). White-box:
  branch coverage of ranking, the use flow (4 paths), category delete and cycle rules. A forced failure
  inside a transaction leaves no partial data.
- Right column "Also checked": role checks; passwords hashed; JWT secret required; login rate limit; CORS.
- Bottom line (muted): "Not covered: web unit tests, console accessibility, 360 px layout, load tests."
- Optional `[IMG testing.png]` (I6), 2 x 2 in.
- Notes: "Traceability from requirement to test is in the report: docs/08-report.md."

### Slide 15. Limitations and future work (light)

- Title: "What it does not do yet"
- Left card **Limitations** (icons in front of each line):
  - "Used" is self-reported: the user presses the button.
  - Search matches exact keywords and prefixes; no synonyms or fuzzy matching.
  - The login rate limiter lives in one process's memory, so it is not shared across serverless
    instances; the login token is kept in browser local storage.
  - Speed was measured for the ranking code only, not under load.
  - The web app has no unit tests; accessibility was scanned on five public pages only.
  - Categories are curated by hand.
- Right card **Future work**: synonym and embedding-based keyword suggestions; report-only suggestions of
  what to purge; duplicate detection by code similarity; version history for a component; token in an
  httpOnly cookie; a shared rate-limit store.
- `[IMG roadmap.png]` optional (I7), 2.5 x 2.5 in.
- Notes: "I list the limits myself, because each one has a clear next step."

### Slide 16. Thank you (dark)

- Title: "Thank you"; subtitle "Questions?"
- Small line: `[TODO: repository link]`
- `[IMG hero.png]` reuse from slide 1, smaller.

### Slide A1. Appendix: backend class diagram (light)

- Title: "Backend classes and their dependencies"
- `[IMG class-backend.png]`, frame 8.8 in wide x 6.0 in tall (image 3456 x 2365, aspect 1.46).
- Caption: "Services are modules of functions, drawn as classes to show what each offers and depends on."

### Slide A2. Appendix: data flow diagrams (light)

- Title: "Data flow: context and level 1"
- Left: `[IMG dfd-level0.png]`, right: `[IMG dfd-level1.png]` (see section 6).
- Reference for redrawing (this is the project's own DFD, use it exactly):
  - Level 0: external entities **User / Visitor** and **Cataloguer**; one process "Software Component
    Cataloguing System".
  - Level 1: processes **1.0 Authenticate, 2.0 Maintain components and keywords, 3.0 Maintain categories
    and notations, 4.0 Search catalogue, 5.0 Record usage, 6.0 Browse catalogue, 7.0 Report and purge**;
    data stores **D1 Users, D2 Components, D3 Keywords and links, D4 Categories, D5 Notations, D6 Search
    log, D7 Usage events, D8 Audit log**.
  - Key flows: 4.0 reads D3, D2, D4, writes the query and results to D6 and hit counters to D2; 5.0 reads and
    updates D6, updates D2, writes D7; 7.0 reads D2, D6, D7, D8, deletes from D2, writes D8.
- Remove the old 5-process, 4-store DFD.

## 6. Diagram and screenshot images the owner will add

**From the repository (already exist).** All in `docs/diagrams/`; PNG for slides, SVG if sharper is
needed.

| File | Slide | Frame size |
|---|---|---|
| `use-case.png` | 5 | 4.5 x 6.1 in |
| `class-domain.png` | 6 | 7.0 x 6.2 in |
| `class-backend.png` | A1 | 8.8 x 6.0 in |

**Do not exist yet (ask the owner's Claude Code to generate them):** `seq-add.png`,
`seq-search-use.png` (PlantUML sequence diagrams from the message lists in slide 10),
`dfd-level0.png`, `dfd-level1.png` (from `docs/03-structured-analysis.md`). Each should be rendered in
the new palette.

**Screenshots to capture** (Chrome, window about 1600 x 900, zoom 100%). Run the site locally with the
seeded database (`npm run dev`). Log in as `cat@sccs.local` / `changeme123` for cataloguer screens;
register a new user such as `alice@example.com` for user screens. Take the purge screenshot **before**
purging.

| File | Screen | What to show |
|---|---|---|
| `shot-search.png` | `/search` | Keyword `parser`, "Any keyword": results with score badges |
| `shot-detail.png` | `/components/[id]` | A result with Use button and counters |
| `shot-browse.png` | `/browse` | Tree open at Design patterns > Behavioural patterns |
| `shot-console-components.png` | `/console/components/new` | Form with keyword chips |
| `shot-reports.png` | `/console` | Totals and top lists |
| `shot-purge.png` | `/console/purge` | Default criteria, 3 candidates listed |
| `shot-audit.png` | `/console/audit` | Several entries |

## 7. AI-generated images with transparent background (owner makes these)

Generate all in one session so the style matches. Start every prompt with this style line:

> "Flat vector illustration, soft rounded shapes, gentle shadow, deep teal (#0B3C49 and #1F7A8C) with
> warm amber (#F4A62A) accents, clean minimal, no text, no letters, no logos, transparent background."

Export PNG with a transparent background (remove the background if the tool cannot), at least 1600 px on the
long side, and name the files as below.

| ID | File | Slide | Size on slide | Prompt (after the style line) |
|---|---|---|---|---|
| I1 | `hero.png` | 1, 16 | 5.5 x 5.5 in | "Isometric library of software: stacked glossy component cubes and puzzle pieces on shelves, a magnifying glass in front" |
| I2 | `problem.png` | 2 | 3 x 3 in | "A messy pile of documents and code files turning into an organised tree of folders" |
| I3 | `shield.png` | 4 | 2.5 x 2.5 in | "A shield with a check mark next to a small gauge" |
| I4 | `search.png` | 9 | 1.2 x 1.2 in | "A magnifying glass over three keyword tags" |
| I5 | `purge.png` | 9 | 1.2 x 1.2 in | "A broom sweeping small unused boxes into a bin" |
| I6 | `testing.png` | 14 | 2 x 2 in | "A clipboard with green check marks and two gears" |
| I7 | `roadmap.png` | 15 | 2.5 x 2.5 in | "A signpost with three arrows and a light bulb" |

Every image is optional except I1. If an image is missing, the slide must still look complete without
it: do not leave an empty frame in the final deck.

The teal, mist and amber colours of the diagrams should also change. Re-rendering the three diagrams in
the new palette is a separate job for Claude Code (edit the `skinparam` colours in the `.puml` files).

## 8. Never say (these are false for this system)

- Automatic, scheduled, cron or daemon purge; "Admin scheduled" anything.
- Fuzzy, semantic, AI or synonym search; "inverted index"; "multi-facet".
- Asynchronous counters, queues, workers or telemetry pipelines.
- Spring Boot, Java 17, Maven, Docker, JUnit, React 18, Node 20, Alpine, microservices.
- `UsageStatistic`, `ReuseInfo`, `Query`, abstract `User`, `CatalogueUser`, `Keyword.weight`, a repository
  layer, `ComponentRepo`.
- File or package upload, code export, "copy code", growth-rate charts, "recent submissions", a dashboard
  for every user.
- Retries with circuit breakers, keyset pagination, offline cache, deep-tree (12 level) tests,
  concurrency or race tests, fault-injection suites, load tests.
- "Approved", "verified by the university", "production-grade", "WCAG AA compliant", "99% availability".
- Anything about a year other than 2026.

## 9. Final checks

- All 16 main slides and 2 appendix slides exist in the order of section 3.
- Every number on a slide matches section 1 (61, 9, 98%, 48, 27, 11, 14 use cases, 10 classes).
- No text is cut off or overlaps; nothing is smaller than 12 pt; margins at least 0.5 in.
- Only colours from section 4; only Cambria, Calibri and Courier New.
- Every image frame is labelled `INSERT: <file>` and sized as listed, and speaker notes exist on every slide.
- Reply with the changed-slides list, the `[TODO]` list and any doubts.
