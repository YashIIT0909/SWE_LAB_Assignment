# PPT_Modify.md: rebuild the SCCS presentation

You are given a complete package (this folder). Your job: produce a corrected, redesigned version of
the presentation and save it as `Software_Component_Cataloguing_System_v2.pptx`.

The old deck was written before the system was finished and contradicts the real system in many
places. This file says what is wrong, what every slide must say instead, the new look, and where every
picture is. Read section 0 first.

## Package contents

```
PPT_Modify.md                                   this file (the instructions)
Software_Component_Cataloguing_System.pptx      the OLD deck (11 slides): read it, do not reuse its claims
context/                                        background documents, read-only
  CLAUDE.md                                     summary of the whole system
  00-problem-statement.md   01-SRS.md   02-use-cases.md   03-structured-analysis.md
  04-design.md   06-test-plan.md   08-report.md
images/
  diagrams/      8 diagrams, each as PNG (for slides) and SVG: use-case, class-domain, class-backend,
                 seq-add, seq-search, seq-use, dfd-level0, dfd-level1
  screenshots/   7 screenshots of the running website
  ai-generated/  optional illustrations made by the owner (may be empty; see section 7)
```

## 0. Ground rules (read first)

1. **Facts come only from section 1 of this file** (and the `context/` documents). Do not invent numbers,
   features, versions or technologies. If a slide needs a fact that is not there, leave a visible
   `[TODO: ...]` marker and list it in your final message.
2. **Use the provided images.** Insert every picture named in section 5 from `images/`. Keep each
   picture's **aspect ratio (never stretch)** and fit it inside the box given. Use the PNG. The
   diagram PNGs have a white background: put them on a white rounded card with a thin `CFE0E0`
   border. Give screenshots the same rounded frame. If a file in `images/ai-generated/` exists, use it
   as described in section 7; if it does not, design the slide so it looks complete without it. **Never
   generate or draw a substitute picture**, and never leave an empty placeholder frame in the final deck.
3. **Keep 16:9, 13.333 in x 7.5 in.** Keep at least 0.5 in margin. No text may overflow or be cut off.
4. **Editing approach:** the old deck has no pictures and every element is a loose text box or shape
   (named `Text 0`, `Text 1`, ...). Building each slide from scratch in the new design is easier and
   cleaner than editing the old shapes. Keep the slide order from section 3.
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

**Course and team.** Software Engineering Lab, Assignment 8 (problem: Software Component
Cataloguing), IIT (ISM) Dhanbad, September 2026. Team: **Dinesh Krishna, Sankar, Vishesh, Sai Teja,
Yash Agarwal, Yash Patidar**. Repository: https://github.com/YashIIT0909/SWE_LAB_Assignment.
Deliverables: SRS (functional and non-functional requirements), UML use case and class diagrams,
this PPT, and the working website.

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
in `context/01-SRS.md`. Their content is in slides 3 and 4 below.

**Testing (exact numbers, last run 30 Sep 2026).** 5 unit tests (shared package) + 56 unit and
integration tests (API, Vitest + Supertest against a real PostgreSQL test database) = **61**, all passing.
**9** Playwright end-to-end scenarios (browse-search-use, cataloguer lifecycle, purge flow, 5 axe
accessibility scans, 1 keyboard-only search), all passing. Line coverage of the API **98.31%**
(services 99.61%; thresholds 70% and 80%). GitHub Actions CI is green (lint, format check, type check,
migrate, tests, web build, seed, end-to-end). 48 numbered test cases (T-01 to T-48) traced to
requirements in `context/06-test-plan.md` and `context/08-report.md`. Techniques: equivalence classes and
boundary values (search keywords 0/1/10/11, term length 0/1/50/51, page size 0/1/50/51, purge thresholds
exactly at the boundary), branch coverage on the ranking and use logic, a forced failure inside a
transaction (nothing is half-written), role checks, bcrypt check, JWT-secret check, rate-limit check.

**Not tested or not done (be honest about these).** Web app has no unit tests. Accessibility was scanned
on 5 public pages only (not the console); a 360 px layout was not tested. Performance test times only the
ranking function in memory (10,000 components, 5,000 keywords, 200 searches, 95th percentile under
500 ms), not the full request. No load or concurrency test.

## 2. What is wrong in the current deck

| Slide | Problem                                                                                                                                                                                                                                                | Severity |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1     | "APPROVED" stamp, "INDEX ID CATALOGUE-CORE-2025", "SPEC 4.02 // ARCHIVE" are invented; year is wrong; "Multi-Facet Inverted Keyword Index" is not what was built; no team, course or date.                                                             | High     |
| 2     | Lists 3 languages only (system has 6); the example path `/Root/Security/Authentication/Design/UML/Tokens` puts the notation inside the category path, which is not how it works; claims about lookup speed are not measured.                           | Medium   |
| 3     | Wrong actors ("Catalogue User" is read-only); says purge is an **automated daemon**; "Maintain usage metrics" drawn as a use case; hand-drawn diagram, not UML.                                                                                        | High     |
| 4     | Class model is invented: `UsageStatistic`, `ReuseInfo`, `Query`, abstract `User` with two subclasses, `Keyword.weight` do not exist. Multiplicities are wrong.                                                                                         | High     |
| 5     | Has a `:ComponentRepo` layer (there is none); keywords attached in a separate step (they are saved with the component in one transaction); claims counters are updated **asynchronously** (they are synchronous, in the same transaction).             | High     |
| 6     | DFD has 5 processes and 4 stores; the project's own DFD has 7 processes and 8 stores (provided as images).                                                                                                                                             | Medium   |
| 7     | "Scheduled daemon / cron: purgeUnused()" is false; "fuzzy keyword queries" is false; "checkout event" is not how use works; "engine maps into the tree ... inheritance" is invented; "file packages" (components store text content and a source URL). | High     |
| 8     | Entire stack is wrong: Spring Boot, Java 17, Maven, Docker, JUnit, React 18.2, Node 20, Alpine are not used.                                                                                                                                           | High     |
| 9     | Claims that are not implemented or tested: trees deeper than 12 levels, offline cache recovery, cursor paging, concurrent-purge races, fault-injection suites.                                                                                         | High     |
| 10    | Screen list does not match the site (no "Dashboard" with growth rates, no "export specs", no "copy code"); real screens differ.                                                                                                                        | Medium   |
| 11    | "Distributed fallacies" mitigations are mostly not implemented (retries with circuit breaker, keyset pagination, async aggregations, micro-endpoints). Limitations are incomplete.                                                                     | High     |
| all   | No requirements (FR/NFR) slide, no demo screenshots, no architecture diagram, no real test numbers.                                                                                                                                                    | High     |

## 3. New slide list

The deck goes from 11 to 16 main slides plus 4 appendix slides.

| #   | Slide                                       | Based on old slide |
| --- | ------------------------------------------- | ------------------ |
| 1   | Title                                       | 1                  |
| 2   | Problem and scope                           | 2                  |
| 3   | Functional requirements                     | new                |
| 4   | Non-functional requirements                 | new                |
| 5   | Use case model                              | 3                  |
| 6   | Domain class model                          | 4                  |
| 7   | Architecture                                | new                |
| 8   | Technology stack                            | 8                  |
| 9   | How it works                                | 7                  |
| 10  | Sequence diagrams: search, then use         | 5                  |
| 11  | Screens and roles                           | 10                 |
| 12  | Demo: visitor and user                      | new                |
| 13  | Demo: cataloguer console                    | new                |
| 14  | Testing and verification                    | 9                  |
| 15  | Limitations and future work                 | 11                 |
| 16  | Thank you / questions                       | new                |
| A1  | Appendix: backend class diagram             | new                |
| A2  | Appendix: sequence diagram, add a component | 5                  |
| A3  | Appendix: data flow, context level          | 6                  |
| A4  | Appendix: data flow, level 1                | 6                  |

Delete the old "Integration Fallacies" slide content. Do not keep any mitigation that section 8 forbids.

## 4. New design

The old look (orange `FF5A0F` accent, uppercase Courier labels, "spec sheet" style) goes away. The
diagram images were already drawn in the new palette below, so the deck and the pictures match.

**Palette** (hex, no `#` in code). One dominant colour, one sharp accent.

| Role      | Hex      | Use                                                                   |
| --------- | -------- | --------------------------------------------------------------------- |
| Deep teal | `0B3C49` | Dominant. Backgrounds of slides 1, 16 and section headers; dark cards |
| Teal      | `1F7A8C` | Secondary. Icons, chart bars, table headers, links                    |
| Mist      | `E8F3F2` | Card and panel fill on light slides                                   |
| White     | `FFFFFF` | Background of content slides                                          |
| Amber     | `F4A62A` | The one accent: key numbers, badges, highlights. Use sparingly        |
| Ink       | `10262B` | Body text on light backgrounds                                        |
| Muted     | `5A7177` | Captions and secondary text                                           |
| Line      | `CFE0E0` | Thin borders, table lines                                             |

Dark slides (1, 16): deep teal background, white text, amber accent. Content slides: white background,
ink text, mist cards. Keep contrast high: never amber text on white, never muted text on teal.

**Fonts** (all safe in PowerPoint): titles **Cambria** bold 34 to 40 pt; body **Calibri** 16 pt (tables
and dense cards 12 to 14 pt, nothing smaller than 12 pt); captions Calibri 12 pt muted; endpoint and
code tokens (`POST /search`) **Courier New** 13 pt.

**Motif (repeat on every content slide):** rounded-rectangle cards (corner radius about 0.12 in, mist
fill, very soft shadow) and a small icon in a teal circle at the start of each card heading. Numbered
steps use amber circles with dark text. Pictures sit in rounded frames (see rule 2).

**Do not use:** accent lines under titles, coloured bars or stripes along slide or card edges, centred
body paragraphs, the same layout on consecutive slides, text-only slides. Left-align text. Titles are
sentences that state the point (for example "Purge is manual, not scheduled"), not one-word labels.

**Layout rhythm.** Vary: two columns (text left, picture right), icon-and-text rows, 2x2 or 2x4 card
grids, big-number callouts, a table, a full-width diagram. Gaps between blocks 0.3 in. Footer: small
muted text bottom-left "SCCS · Software Engineering · Assignment 8" and the slide number bottom-right,
on content slides only.

## 5. Slide-by-slide content

Text in quotes is final wording. `[PIC file]` means: insert that image (section 6), fitted inside the
box stated, aspect ratio kept.

### Slide 1. Title (dark)

- Title: "Software Component Cataloguing System"
- Subtitle: "A searchable catalogue of reusable design and code components, with usage tracking to find and
  purge the ones nobody uses."
- Three fact chips: "10 notations: 4 design, 6 code" / "Keyword search with ranking" / "Usage counters and
  purge".
- Meta: "Software Engineering Lab · Assignment 8 · IIT (ISM) Dhanbad · September 2026"
- Team: "Dinesh Krishna · Sankar · Vishesh · Sai Teja · Yash Agarwal · Yash Patidar"
- Optional `[AI hero.png]` right side, about 5.5 x 5.5 in (section 7). Without it, use a large amber
  number "14" with the label "use cases" and "27 requirements" as a bold typographic element instead.
- Remove: "ACADEMIC SUBMISSION", "SPEC 4.02", "ARCHIVE", "INDEX ID", "APPROVED", "CATALOGUE-CORE-2025",
  "Inverted Keyword Index".
- Notes: "This is the system we built for Assignment 8: a catalogue of reusable designs and code, as a web
  application."

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
- Optional `[AI problem.png]`, 3 x 3 in, only if it fits.
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

| Category                | Requirement                                                                                | Evidence             |
| ----------------------- | ------------------------------------------------------------------------------------------ | -------------------- |
| Performance (NFR-1)     | Ranking 10,000 components with 5,000 keywords: 95th percentile under 500 ms (ranking only) | Benchmark T-40       |
| Security (NFR-2)        | Passwords bcrypt-hashed, never returned; JWT secret only from environment                  | T-44, T-47           |
| Security (NFR-3)        | Role checks on the server for every write and report                                       | T-06, T-25           |
| Security (NFR-10)       | 20 login or register requests per IP per 15 minutes                                        | T-48                 |
| Security (NFR-11)       | CORS allow-list for browser origins                                                        | Checked by hand      |
| Validation (NFR-4)      | Shared zod schemas; fixed error shape; no stack traces                                     | T-09, T-20           |
| Usability (NFR-5)       | Core tasks in 3 screens; keyboard use; no axe violations on 5 public pages                 | E2E T-41, T-42, T-45 |
| Reliability (NFR-6)     | `/health` reports API and database status                                                  | T-01                 |
| Data integrity (NFR-8)  | Counters and cascades atomic; never negative                                               | T-26, T-11, T-24     |
| Maintainability (NFR-7) | Strict TypeScript, layers, at least 80% service coverage, CI                               | CI, coverage gate    |
| Portability (NFR-9)     | Node 22, configuration by environment variables                                            | Windows and Linux CI |

- Add a small amber callout beside the table: "NFR-1 measures the ranking code only, not the network."
- Notes: "We only claim what we can show; the right column says how each one is checked."
- Optional `[AI shield.png]`, 2.5 x 2.5 in, top right.

### Slide 5. Use case model (light)

- Title: "3 actors, 14 use cases"
- Left: `[PIC images/diagrams/use-case.png]`, fit inside **4.3 in wide x 6.1 in tall** (1620 x 2324 px).
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
- Left: `[PIC images/diagrams/class-domain.png]`, fit inside **6.7 in wide x 6.2 in tall** (2473 x 2289 px).
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
- Optional small images on steps 3 and 5 (`[AI search.png]`, `[AI purge.png]`), 1.2 x 1.2 in.
- Notes: "A component shown many times but never used is the purge candidate this design is built to find."

### Slide 10. Sequence diagrams: search, then use (light)

- Title: "Search and use: both are single transactions"
- Two panels side by side, each on a white rounded card:
  - Left: `[PIC images/diagrams/seq-search.png]`, fit inside **6.0 in wide x 4.8 in tall** (2129 x 1711 px).
  - Right: `[PIC images/diagrams/seq-use.png]`, fit inside **6.0 in wide x 4.8 in tall** (1752 x 1455 px).
- Captions under the panels (Calibri 13 pt):
  - Left: "Search: validate, score, save the query and add the hit counters for the page, all in one
    transaction."
  - Right: "Use: mark the result used, lower hits-not-used, raise uses, log the event, all in one
    transaction."
- Notes: "A failure in either flow leaves nothing half-written; there is a test that forces a failure."

### Slide 11. Screens and roles (light)

- Title: "Public pages for everyone, a console for the cataloguer"
- Two tables side by side.

| Public screen   | Route                 | What you can do                                                           |
| --------------- | --------------------- | ------------------------------------------------------------------------- |
| Home            | `/`                   | Search box, API and database status                                       |
| Search          | `/search`             | Keywords, any or all, filters (kind, notation, category), scores, **Use** |
| Browse          | `/browse`             | Category tree, breadcrumb, component list, sort, subcategories            |
| Component       | `/components/[id]`    | Details, keywords, counters, content, **Use**                             |
| Login, Register | `/login`, `/register` | Log in; register as User                                                  |

| Cataloguer screen | Route                 | What you can do                            |
| ----------------- | --------------------- | ------------------------------------------ |
| Reports           | `/console`            | Totals, top used, top not used, never used |
| Components        | `/console/components` | List, create, edit, delete, keyword chips  |
| Categories        | `/console/categories` | Create, rename, move, delete with reassign |
| Notations         | `/console/notations`  | List and add notations                     |
| Purge             | `/console/purge`      | Criteria, candidates, confirm              |
| Audit             | `/console/audit`      | Change history, filter by action           |

- Note: "Use needs a login. The console is for cataloguers only."
- Notes: "The same site adapts to the role: visitors, users and cataloguers see different menus."

### Slide 12. Demo: visitor and user (light)

- Title: "Demo: find a component and use it"
- Three screenshots, each fitted inside its box (aspect ratio kept), rounded frame, numbered caption
  beside or under it:
  1. `[PIC images/screenshots/shot-search.png]` (2400 x 1350), box about **6.6 x 3.7 in**, left.
     Caption: "Search 'parser', any keyword: results with score and matched keywords"
  2. `[PIC images/screenshots/shot-detail.png]` (1440 x 792), box about **5.6 x 3.1 in**, right top.
     Caption: "Open a result: details and counters, after pressing Use"
  3. `[PIC images/screenshots/shot-browse.png]` (2400 x 867), box about **5.6 x 2.0 in**, right bottom.
     Caption: "Browse the tree: Design patterns > Behavioural patterns"
- Below: one line: "Counters change: hits-not-used goes down when the result is used."
- Notes: "Demo order: search, open, use, then show the counters change."

### Slide 13. Demo: cataloguer console (light)

- Title: "Demo: the cataloguer keeps the catalogue clean"
- Four screenshots in a 2 x 2 arrangement, each fitted inside its box, with captions:
  1. `[PIC images/screenshots/shot-console-components.png]` (2400 x 1206), box **5.4 x 2.7 in**.
     "Add a component with keyword chips"
  2. `[PIC images/screenshots/shot-reports.png]` (2400 x 1350), box **4.8 x 2.7 in**.
     "Reports: totals, top used, never used"
  3. `[PIC images/screenshots/shot-purge.png]` (2400 x 924), box **5.5 x 2.1 in**.
     "Purge: 3 old unused components found with the default criteria"
  4. `[PIC images/screenshots/shot-audit.png]` (2400 x 884), box **5.6 x 2.1 in**.
     "Audit log: every change recorded"
- The screenshots show demo data; do not quote the numbers inside them anywhere else.
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
- Optional `[AI testing.png]`, 2 x 2 in.
- Notes: "Traceability from requirement to test is in the report."

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
- Optional `[AI roadmap.png]`, 2.5 x 2.5 in.
- Notes: "We list the limits ourselves, because each one has a clear next step."

### Slide 16. Thank you (dark)

- Title: "Thank you"; subtitle "Questions?"
- Team line: "Dinesh Krishna · Sankar · Vishesh · Sai Teja · Yash Agarwal · Yash Patidar"
- Repository: "github.com/YashIIT0909/SWE_LAB_Assignment" (make it a working link:
  https://github.com/YashIIT0909/SWE_LAB_Assignment)
- Optional `[AI hero.png]` reused from slide 1, smaller.

### Slide A1. Appendix: backend class diagram (light)

- Title: "Backend classes and their dependencies"
- `[PIC images/diagrams/class-backend.png]`, fit inside **9.0 in wide x 6.0 in tall** (3282 x 2340 px).
  Use the space to the right for a short legend.
- Caption: "Services are modules of functions, drawn as classes to show what each offers and depends on."

### Slide A2. Appendix: sequence diagram, add a component (light)

- Title: "Adding a component with keywords"
- `[PIC images/diagrams/seq-add.png]`, fit inside **8.0 in wide x 6.0 in tall** (2281 x 1705 px).
- Right side, short text: "One transaction: the component, its keywords and the audit row are saved
  together, or not at all. Keyword suggestions while typing come from a separate call."

### Slide A3. Appendix: data flow, context level (light)

- Title: "Data flow: the system and its two actors"
- `[PIC images/diagrams/dfd-level0.png]`, fit inside **12.0 in wide x 3.5 in tall** (1439 x 418 px).
- Below the picture, two short columns: "User / Visitor sends: registration, credentials, search keywords,
  browse requests, use notifications" and "Cataloguer sends: credentials, component, category and notation
  details, report and purge criteria, purge selection".

### Slide A4. Appendix: data flow, level 1 (light)

- Title: "Data flow: seven processes and eight data stores"
- Left: `[PIC images/diagrams/dfd-level1.png]`, fit inside **6.2 in wide x 6.3 in tall**
  (2955 x 3208 px). It is dense; tell the owner in your reply that the SVG can be zoomed.
- Right: a two-part legend. **Processes:** 1.0 Authenticate, 2.0 Maintain components and keywords, 3.0
  Maintain categories and notations, 4.0 Search catalogue, 5.0 Record usage, 6.0 Browse catalogue, 7.0
  Report and purge. **Data stores:** D1 Users, D2 Components, D3 Keywords and links, D4 Categories,
  D5 Notations, D6 Search log, D7 Usage events, D8 Audit log.

## 6. Images provided in `images/`

**Diagrams** (`images/diagrams/`, PNG for slides; the same names with `.svg` are vector copies). All were drawn
in the palette of section 4 on a white background.

| File                | Pixels      | Slide | Fit inside    |
| ------------------- | ----------- | ----- | ------------- |
| `use-case.png`      | 1620 x 2324 | 5     | 4.3 x 6.1 in  |
| `class-domain.png`  | 2473 x 2289 | 6     | 6.7 x 6.2 in  |
| `seq-search.png`    | 2129 x 1711 | 10    | 6.0 x 4.8 in  |
| `seq-use.png`       | 1752 x 1455 | 10    | 6.0 x 4.8 in  |
| `class-backend.png` | 3282 x 2340 | A1    | 9.0 x 6.0 in  |
| `seq-add.png`       | 2281 x 1705 | A2    | 8.0 x 6.0 in  |
| `dfd-level0.png`    | 1439 x 418  | A3    | 12.0 x 3.5 in |
| `dfd-level1.png`    | 2955 x 3208 | A4    | 6.2 x 6.3 in  |

**Screenshots** (`images/screenshots/`): real pages of the running website, taken at 1600 x 900 (scaled
1.5x). Pages with a footer were cropped above it. The website has its own look (black and white with
indigo); frame the pictures, do not recolour them.

| File                          | Pixels      | Slide | Shows                                                 |
| ----------------------------- | ----------- | ----- | ----------------------------------------------------- |
| `shot-search.png`             | 2400 x 1350 | 12    | Keyword `parser`, "Any keyword", 3 results with score |
| `shot-detail.png`             | 1440 x 792  | 12    | CSV parser detail after pressing Use, with counters   |
| `shot-browse.png`             | 2400 x 867  | 12    | Tree open at Behavioural patterns, 2 components       |
| `shot-console-components.png` | 2400 x 1206 | 13    | New component form, keyword chips filled              |
| `shot-reports.png`            | 2400 x 1350 | 13    | Catalogue report: totals, top used, by notation       |
| `shot-purge.png`              | 2400 x 924  | 13    | Default criteria, 3 purge candidates                  |
| `shot-audit.png`              | 2400 x 884  | 13    | Audit log with several entries                        |

## 7. Optional illustrations (`images/ai-generated/`)

The owner may add transparent-background PNG illustrations (made with an AI image tool) to
`images/ai-generated/`. Use a file **only if it exists**; the deck must look finished without any of them.
Expected names and places:

| File          | Slide | Size on slide                    |
| ------------- | ----- | -------------------------------- |
| `hero.png`    | 1, 16 | 5.5 x 5.5 in (slide 16: smaller) |
| `problem.png` | 2     | 3 x 3 in                         |
| `shield.png`  | 4     | 2.5 x 2.5 in                     |
| `search.png`  | 9     | 1.2 x 1.2 in                     |
| `purge.png`   | 9     | 1.2 x 1.2 in                     |
| `testing.png` | 14    | 2 x 2 in                         |
| `roadmap.png` | 15    | 2.5 x 2.5 in                     |

They share one style (flat vector, teal and amber, no text). Do not recolour them.

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
- "Approved", "verified by the university", "production-grade", "WCAG AA compliant", "99% availability",
  "IEEE 830 aligned" (the SRS contains requirements only).
- Anything about a year other than 2026.

## 9. Final checks

- All 16 main slides and 4 appendix slides exist in the order of section 3, saved as
  `Software_Component_Cataloguing_System_v2.pptx`.
- Every number on a slide matches section 1 (61, 9, 98%, 48, 27, 11, 14 use cases, 10 classes).
- Every picture is from `images/`, unstretched, and inside the box given; no empty frames.
- No text is cut off or overlaps; nothing is smaller than 12 pt; margins at least 0.5 in.
- Only colours from section 4; only Cambria, Calibri and Courier New.
- The six team names and the repository link are correct on slides 1 and 16; speaker notes exist on
  every slide.
- Reply with the changed-slides list, the `[TODO]` list and any doubts.
