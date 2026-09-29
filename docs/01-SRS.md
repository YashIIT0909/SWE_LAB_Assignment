# Software Requirements Specification — Software Component Cataloguing System

Version 1.0 · Phase 0 · Format follows IEEE Std 830-1998.

## 1. Introduction

### 1.1 Purpose

This SRS specifies the functional and non-functional requirements of the Software Component
Cataloguing System (SCCS). It is written for the development team, the course instructor who
evaluates the project, and future maintainers. Every later design, code and test artefact traces
back to the requirement identifiers defined here.

### 1.2 Scope

SCCS is a web application that stores a catalogue of potentially reusable software components
(designs and code), lets cataloguers maintain the catalogue, lets users find components by
keyword search or by browsing a hierarchical category tree, and records how often each component
is used or shown without being used so that unused components can be purged. Out of scope:
storing binary artefacts (only text `content` and a `sourceUrl`), versioning histories of a
component, and integration with external repositories.

### 1.3 Definitions, acronyms and abbreviations

| Term | Meaning |
|---|---|
| Component | A potentially reusable design or code artefact described by a catalogue record. |
| Kind | `DESIGN` or `CODE`. |
| Notation | The design notation (UML, ERD, Structured Design, DFD, ...) or programming language (Java, Python, ...) of a component. Each notation has a kind. |
| Keyword | A lowercase, trimmed term associated with components as reuse information. |
| Category | A node in the hierarchical classification tree of components. |
| Cataloguer | Privileged actor who maintains the catalogue (role `CATALOGUER`). |
| User | Actor who searches, browses and uses components (role `USER`). |
| Query hit | A component appearing on the returned page of a keyword search. |
| Hit not used | A query hit that was not followed by a "use" referencing that search. |
| Purge | Deletion of components that satisfy the unused criteria. |
| API | The REST interface under `/api/v1`. |
| p95 | 95th percentile latency. |
| SRS, FR, NFR, UC | Software Requirements Specification, Functional Requirement, Non-Functional Requirement, Use Case. |

### 1.4 References

1. IEEE Std 830-1998, *Recommended Practice for Software Requirements Specifications*.
2. `docs/00-problem-statement.md` — the original problem statement.
3. `CLAUDE.md` — project conventions, data model and API contract (authoritative).
4. `docs/02-use-cases.md`, `docs/03-structured-analysis.md`, `docs/04-design.md`,
   `docs/05-api.md`, `docs/06-test-plan.md`, `docs/07-project-plan.md`.
5. R. Mall, *Fundamentals of Software Engineering* — source of the problem statement.

### 1.5 Overview

Section 2 describes the product in general terms. Section 3 lists specific requirements:
functional (3.1), non-functional (3.2) and external interfaces (3.3). Section 4 contains the
traceability matrix.

## 2. Overall description

### 2.1 Product perspective

SCCS is a new, self-contained system. It consists of a Next.js web client, an Express REST API
and a PostgreSQL database (Supabase). Both applications are deployed on Vercel. The web client talks
to the API only; the API is the only component that accesses the database.

### 2.2 Product functions

- Maintain a catalogue of design and code components with notation, category and metadata.
- Associate keywords with components.
- Keyword search with ranking and filters; keyword autocomplete.
- Hierarchical categories; browsing categories and their components.
- Record usage and query-hit statistics per component.
- Reports, purge of unused components, and an audit log of catalogue changes.
- Registration, login and role-based access control.

### 2.3 User classes and characteristics

| Class | Characteristics | Privileges |
|---|---|---|
| Anonymous visitor | Any browser user. | Browse, view, search. |
| User (`USER`) | Software developer looking for reusable components; basic web skills. | Visitor privileges plus marking components as used. |
| Cataloguer (`CATALOGUER`) | Librarian or senior developer responsible for the catalogue; trained on the system. | All User privileges plus catalogue maintenance, reports and purge. |

### 2.4 Constraints

- C-1 Stack: Next.js (App Router), Node.js 22 LTS, Express, TypeScript, Prisma, PostgreSQL on Supabase.
- C-2 Hosting: Vercel (serverless) for web and API; Supabase free tier for the database (Postgres only; auth stays in the API).
- C-3 API follows the conventions in `CLAUDE.md` (base path, error shape, pagination).
- C-4 Registration creates only `USER` accounts; cataloguers are provisioned by seed.
- C-5 Academic timeline of ten phases (see `docs/07-project-plan.md`).

### 2.5 Assumptions and dependencies

- A-1 Users have a modern evergreen browser (Chrome, Firefox, Safari, Edge; last two versions).
- A-2 Supabase and Vercel remain available on their free tiers for the project's duration.
- A-3 Component content is textual (source code, diagram description or text export); large
  binaries are referenced through `sourceUrl`.
- A-4 "Used" is self-reported by the user pressing "Use this component".
- A-5 The catalogue size targeted is up to 10,000 components and 5,000 distinct keywords.

## 3. Specific requirements

### 3.1 Functional requirements

Source column refers to the numbered sentences of the problem statement in section 4.1.

| ID | Requirement | Source |
|---|---|---|
| FR-1 | The system shall maintain a persistent catalogue of software component records and expose functions (create, read, update, delete, search, browse, report) on it. | S1 |
| FR-2 | Each component record shall hold: name, description, kind, notation, category, version (default `1.0.0`), optional author, optional source URL, optional text content, creator, usage counters and timestamps. | S2 |
| FR-3 | Any visitor shall be able to view a component's full details including notation, category breadcrumb and keywords. | S2, S10 |
| FR-4 | Every component shall be classified as either `DESIGN` or `CODE`. | S3 |
| FR-5 | The system shall support design notations and be seeded with UML, ERD, Structured Design and DFD (kind `DESIGN`). | S4 |
| FR-6 | The system shall support programming-language notations and be seeded with Java, Python, C, C++, JavaScript and TypeScript (kind `CODE`). | S5 |
| FR-7 | A cataloguer shall be able to add notations; a component's notation kind must equal the component kind (`NOTATION_KIND_MISMATCH` otherwise). | S4, S5 |
| FR-8 | A cataloguer shall be able to enter (create) a component in the catalogue, optionally with keywords. | S6 |
| FR-9 | A cataloguer shall be able to edit a component's fields. | S6 |
| FR-10 | A cataloguer shall be able to delete a component; its keyword links, search results and usage events are removed with it. | S6 |
| FR-11 | A cataloguer shall be able to associate a set of keywords with a component: replace the set, add keywords, remove a keyword. Keywords are stored trimmed, lowercase and unique. | S6 |
| FR-12 | Only cataloguers shall perform catalogue write operations; other callers receive `FORBIDDEN` or `UNAUTHENTICATED`. | S6 |
| FR-13 | Visitors shall be able to register (always as `USER`) and log in; cataloguer accounts are created by seed. | S6, S7 |
| FR-14 | A user shall be able to query the availability of components with 1 to 10 keywords using match mode `any` or `all`. | S7 |
| FR-15 | Search results shall be ranked (exact keyword = 2, prefix of length >= 3 = 1; order by score desc, useCount desc, name asc), paginated, and filterable by kind, notation and category (optionally including descendants). Each result shows matched keywords and score. | S7 |
| FR-16 | The system shall suggest existing keywords by prefix to help users describe components. | S7 |
| FR-17 | A logged-in user shall be able to mark a component as used; the system increments `useCount`, sets `lastUsedAt` and records a usage event. | S8 |
| FR-18 | For each component returned on a search results page the system shall increment `queryHitCount` and `queryHitNotUsedCount` and record the result; a subsequent use referencing that search decrements `queryHitNotUsedCount` once (never below 0). All counter updates are transactional. | S8 |
| FR-19 | A cataloguer shall be able to view a usage summary report: totals by kind, most used components, components with most hits not used, never-used components. | S8 |
| FR-20 | A cataloguer shall be able to list purge candidates using parameters `maxUses`, `minNotUsedHits`, `unusedForDays`, `olderThanDays`. | S8 |
| FR-21 | A cataloguer shall be able to purge selected candidates; the server re-checks the criteria and deletes only qualifying components. | S8 |
| FR-22 | Every catalogue write (component, keyword, category, notation, purge) shall be recorded in an audit log viewable by cataloguers. | S6, S8 |
| FR-23 | A cataloguer shall be able to create, rename, describe and move categories to form a hierarchy of arbitrary depth, without cycles and with unique sibling names. | S9 |
| FR-24 | A cataloguer shall be able to delete a category; a non-empty category requires a reassignment target for its children and components. | S9 |
| FR-25 | Any visitor shall be able to browse the category tree and see each category's breadcrumb, children and component count. | S9, S10 |
| FR-26 | Any visitor shall be able to list the components in a category, optionally including descendant categories, paginated and sorted by name, newest or most used. | S10 |
| FR-27 | Any visitor shall be able to list all components filtered by kind, notation, category and a name/description text filter (without affecting counters). | S2, S10 |

### 3.2 Non-functional requirements

| ID | Category | Requirement | Verification |
|---|---|---|---|
| NFR-1 | Performance | `POST /search` p95 latency < 500 ms server-side with 10,000 components, 5,000 keywords and ~5 keywords per component (indexes on `Keyword.term`, `ComponentKeyword.keywordId`). Browse and detail endpoints p95 < 300 ms. | T-40 |
| NFR-2 | Security | Passwords stored only as bcrypt hashes (cost >= 10); `passwordHash` never returned by the API. JWT secret from env only. | T-44 |
| NFR-3 | Security | Role checks enforced server-side by middleware on every write and report endpoint; the UI hides but never solely enforces them. | T-06, T-25 |
| NFR-4 | Security / Reliability | All request bodies, params and queries validated with shared zod schemas; invalid input yields `400 VALIDATION_ERROR` with details; no stack traces leak. | T-09, T-20, T-27 |
| NFR-5 | Usability | Core tasks (search then use; add component with keywords) take no more than 3 screens. Keyboard navigable, labelled form controls, WCAG 2.1 AA colour contrast, responsive down to 360 px width. | T-45, T-41 |
| NFR-6 | Availability | Target 99% monthly availability (bounded by Vercel and Supabase free tiers); `/health` reports API and DB status. | T-01 |
| NFR-7 | Maintainability | TypeScript strict, ESLint + Prettier clean, layered backend (Prisma only in services), >= 80% line coverage for services, CI runs lint, typecheck and tests on every push. | CI |
| NFR-8 | Data integrity | Counter updates and cascading deletes are atomic (single transaction); counters never negative. | T-26, T-11 |
| NFR-9 | Portability | Runs on Node 22 LTS; no OS-specific code; configuration only through env vars. | CI |

### 3.3 External interface requirements

#### 3.3.1 User interfaces

- Public: home with search box, search results page (filters, score, matched keywords, "Use"
  button), category browser (tree + breadcrumb + component list), component detail page,
  login and register pages.
- Cataloguer console: components table with create/edit/delete, keyword editor with
  autocomplete, category manager (tree with create/rename/move/delete-with-reassign), notation
  list, reports dashboard, purge screen with criteria form and confirmation, audit log.
- Built with Tailwind + shadcn/ui; errors from the API shown as inline messages using the `message` field.

#### 3.3.2 Software interfaces

- REST/JSON API under `/api/v1` as specified in `docs/05-api.md`.
- PostgreSQL (Supabase) accessed through Prisma ORM.
- Vercel runtime (Node 22) for both applications.

#### 3.3.3 Hardware interfaces

None. The system runs on managed cloud infrastructure and standard client devices.

#### 3.3.4 Communication interfaces

HTTPS only. JSON request and response bodies (`Content-Type: application/json`). Authentication
via `Authorization: Bearer <JWT>`. CORS on the API allows only the configured web origin.

## 4. Traceability

### 4.1 Problem statement sentence -> FR

| # | Sentence (abridged) | FRs |
|---|---|---|
| S1 | The software consists of a components catalogue and various functions defined on it. | FR-1 |
| S2 | The catalogue should hold details of the components which are potentially reusable. | FR-2, FR-3, FR-27 |
| S3 | The reusable components can be either design or code. | FR-4 |
| S4 | The design might use different design notations such as UML, ERD, structured design, etc. | FR-5, FR-7 |
| S5 | The code might be written using different programming languages. | FR-6, FR-7 |
| S6 | A cataloguer may enter components, delete components, and associate keywords. | FR-8, FR-9, FR-10, FR-11, FR-12, FR-13, FR-22 |
| S7 | A user may query the availability of a component using key words. | FR-13, FR-14, FR-15, FR-16 |
| S8 | To help purge unused components, maintain how many times a component was used and how many times it came up in a query but was not used. | FR-17, FR-18, FR-19, FR-20, FR-21, FR-22 |
| S9 | It is desirable to classify the different types of components hierarchically. | FR-23, FR-24, FR-25 |
| S10 | A user should be able to browse the components in each category. | FR-3, FR-25, FR-26, FR-27 |

### 4.2 FR -> use case -> API endpoint -> test

Test IDs are defined in `docs/06-test-plan.md`; test file references are filled in as each phase
implements them.

| FR | Use case | API endpoint(s) | Test IDs |
|---|---|---|---|
| FR-1 | UC-2, UC-8 | `GET /health`, all `/components` endpoints | T-01, T-07 |
| FR-2 | UC-2 | `POST /components`, `GET /components/:id` | T-07, T-09 |
| FR-3 | UC-8, UC-6 | `GET /components/:id` | T-46 |
| FR-4 | UC-2 | `POST /components` | T-07, T-09 |
| FR-5 | UC-12 | `GET /notations?kind=DESIGN` | T-14 |
| FR-6 | UC-12 | `GET /notations?kind=CODE` | T-14 |
| FR-7 | UC-12, UC-2, UC-3 | `POST /notations`, `POST /components`, `PATCH /components/:id` | T-08, T-10, T-15 |
| FR-8 | UC-2 | `POST /components` | T-07, T-09, T-42 |
| FR-9 | UC-3 | `PATCH /components/:id` | T-10, T-42 |
| FR-10 | UC-4 | `DELETE /components/:id` | T-11, T-42 |
| FR-11 | UC-5, UC-2 | `PUT/POST /components/:id/keywords`, `DELETE /components/:id/keywords/:keywordId` | T-12, T-13 |
| FR-12 | UC-2..UC-5, UC-9..UC-12 | all CAT endpoints | T-06 |
| FR-13 | UC-1 | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | T-02, T-03, T-04, T-05, T-44 |
| FR-14 | UC-6 | `POST /search` | T-16, T-17, T-20, T-41 |
| FR-15 | UC-6 | `POST /search` | T-16, T-18, T-19, T-27, T-40 |
| FR-16 | UC-6, UC-5 | `GET /keywords` | T-35 |
| FR-17 | UC-7 | `POST /components/:id/use` | T-22, T-24, T-25, T-41 |
| FR-18 | UC-6, UC-7 | `POST /search`, `POST /components/:id/use` | T-21, T-22, T-23, T-24, T-26 |
| FR-19 | UC-10 | `GET /reports/summary` | T-36, T-43 |
| FR-20 | UC-11 | `GET /reports/purge-candidates` | T-37 |
| FR-21 | UC-11 | `POST /reports/purge` | T-38, T-43 |
| FR-22 | UC-10 | `GET /reports/audit` | T-39 |
| FR-23 | UC-9 | `POST /categories`, `PATCH /categories/:id` | T-31, T-32 |
| FR-24 | UC-9 | `DELETE /categories/:id?reassignTo=` | T-33 |
| FR-25 | UC-8 | `GET /categories/tree`, `GET /categories/:id` | T-28, T-29 |
| FR-26 | UC-8 | `GET /categories/:id/components` | T-30, T-27 |
| FR-27 | UC-8 | `GET /components` | T-34 |
