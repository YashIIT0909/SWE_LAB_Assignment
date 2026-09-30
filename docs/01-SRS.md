# Software Requirements Specification — Software Component Cataloguing System

Version 2.0 · 30 Sep 2026 · derived from the implemented system. Contains functional and
non-functional requirements only; design, API details and test cases are in the other files of
`docs/` (see `docs/README.md`).

## 1. Introduction

### 1.1 Purpose

This SRS states what the Software Component Cataloguing System (SCCS) must do (functional
requirements, FR) and how well it must do it (non-functional requirements, NFR). Every requirement
has a unique ID, is written so it can be checked, and describes behaviour the delivered system
actually has.

### 1.2 Scope

SCCS is a web application that stores a catalogue of potentially reusable software components
(designs and code). Cataloguers maintain the catalogue. Users find components by keyword search or by
browsing a hierarchical category tree. The system records how often each component is used, and how
often it appears in a search without being used, so that unused components can be purged.

Out of scope: storing binary artefacts (only text `content` and a `sourceUrl` are kept), version
histories of a component, and integration with external repositories.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Component | A potentially reusable design or code artefact described by a catalogue record. |
| Kind | `DESIGN` or `CODE`. |
| Notation | The design notation (UML, ERD, Structured Design, DFD, ...) or programming language (Java, Python, ...) of a component. Each notation has a kind. |
| Keyword | A lowercase, trimmed term associated with components as reuse information. |
| Category | A node in the hierarchical classification tree of components. |
| Query hit | A component appearing on the returned page of a keyword search. |
| Hit not used | A query hit that was not followed by a "use" that references that search. |
| Purge | Deletion of components that meet the unused criteria. |

### 1.4 Actors

| Actor | Can do |
|---|---|
| Visitor (not logged in) | Browse categories, view components, search. |
| User (`USER`) | Everything a visitor can, plus mark a component as used. |
| Cataloguer (`CATALOGUER`) | Everything a user can, plus maintain components, keywords, categories and notations, view reports and the audit log, and purge unused components. |

## 2. Functional requirements

IDs are stable identifiers, so they are grouped by feature and are not in one continuous run. The
last column gives the sentence of the problem statement (Appendix A) each requirement comes from.

### 2.1 Components and notations

| ID | Requirement | Source |
|---|---|---|
| FR-1 | The system shall maintain a persistent catalogue of software component records and provide functions on it (create, read, update, delete, search, browse, report). | S1 |
| FR-2 | Each component record shall hold: name, description, kind, notation, category, version (default `1.0.0`), optional author, optional source URL, optional text content, creator, usage counters and timestamps. | S2 |
| FR-4 | Every component shall be classified as either `DESIGN` or `CODE`. | S3 |
| FR-5 | The system shall support design notations and be seeded with UML, ERD, Structured Design and DFD (kind `DESIGN`). | S4 |
| FR-6 | The system shall support programming-language notations and be seeded with Java, Python, C, C++, JavaScript and TypeScript (kind `CODE`). | S5 |
| FR-7 | A cataloguer shall be able to add notations. A component's notation kind must equal the component kind, otherwise the request is rejected with `NOTATION_KIND_MISMATCH`. | S4, S5 |
| FR-8 | A cataloguer shall be able to enter (create) a component in the catalogue, optionally with keywords. | S6 |
| FR-9 | A cataloguer shall be able to edit a component's fields. | S6 |
| FR-10 | A cataloguer shall be able to delete a component. Its keyword links, search results and usage events are removed with it. | S6 |

### 2.2 Keywords

| ID | Requirement | Source |
|---|---|---|
| FR-11 | A cataloguer shall be able to associate a set of keywords with a component: replace the set, add keywords, or remove one keyword. Keywords are stored trimmed, lowercase and unique. | S6 |
| FR-16 | The system shall suggest existing keywords by prefix to help users describe components. | S7 |

### 2.3 Accounts and access control

| ID | Requirement | Source |
|---|---|---|
| FR-13 | Visitors shall be able to register (always as `USER`) and log in. Cataloguer accounts are created by the seed script, not through the API. | S6, S7 |
| FR-12 | Only cataloguers shall perform catalogue write operations and use reports. Other callers receive `FORBIDDEN` (logged in as a user) or `UNAUTHENTICATED` (no valid token). | S6 |

### 2.4 Search

| ID | Requirement | Source |
|---|---|---|
| FR-14 | A user shall be able to query the availability of components with 1 to 10 keywords, using match mode `any` or `all`. | S7 |
| FR-15 | Search results shall be ranked (a keyword equal to the term scores 2, a keyword starting with a term of length 3 or more scores 1, and a term's best keyword counts once; order by score descending, then `useCount` descending, then name), paginated, and filterable by kind, notation and category (optionally including descendant categories). Each result shows its matched keywords and score. | S7 |

### 2.5 Usage tracking

| ID | Requirement | Source |
|---|---|---|
| FR-17 | A logged-in user shall be able to mark a component as used. The system then increments `useCount`, sets `lastUsedAt` and records a usage event. | S8 |
| FR-18 | For each component returned on a search results page the system shall increment `queryHitCount` and `queryHitNotUsedCount` and record the result. A later use that references that search decrements `queryHitNotUsedCount` once, never below 0. Counter updates are transactional. | S8 |

### 2.6 Reports, purge and audit

| ID | Requirement | Source |
|---|---|---|
| FR-19 | A cataloguer shall be able to view a usage summary: totals (components by kind, categories, keywords, searches, uses), components per notation, most used components, components with the most hits not used, and the number of never-used components. | S8 |
| FR-20 | A cataloguer shall be able to list purge candidates using the parameters `maxUses`, `minNotUsedHits`, `unusedForDays` and `olderThanDays`. | S8 |
| FR-21 | A cataloguer shall be able to purge selected candidates. The server re-checks the criteria and deletes only components that still qualify, reporting which ids were deleted and which were skipped. | S8 |
| FR-22 | Every catalogue write (component, keyword, category, notation, purge) shall be recorded in an audit log that cataloguers can view. | S6, S8 |

### 2.7 Categories

| ID | Requirement | Source |
|---|---|---|
| FR-23 | A cataloguer shall be able to create, rename, describe and move categories to form a hierarchy of any depth, with no cycles and unique names among siblings. | S9 |
| FR-24 | A cataloguer shall be able to delete a category. A category that still has children or components requires a target category to reassign them to. | S9 |

### 2.8 Browsing and viewing

| ID | Requirement | Source |
|---|---|---|
| FR-3 | Any visitor shall be able to view a component's full details, including notation, category breadcrumb and keywords. | S2, S10 |
| FR-25 | Any visitor shall be able to browse the category tree and see each category's breadcrumb, children and component count. | S9, S10 |
| FR-26 | Any visitor shall be able to list the components in a category, optionally including descendant categories, paginated and sorted by name, newest or most used. | S10 |
| FR-27 | Any visitor shall be able to list all components filtered by kind, notation, category and a name-or-description text filter. This listing does not change any counters. | S2, S10 |

## 3. Non-functional requirements

| ID | Category | Requirement | How it is checked |
|---|---|---|---|
| NFR-1 | Performance | Ranking a search over 10,000 components with 5,000 distinct keywords (about 5 per component) shall take under 500 ms at the 95th percentile. Database and network time are not included. | Benchmark T-40 (`apps/api/test/perf/`) runs 200 searches on the ranking function. |
| NFR-2 | Security | Passwords shall be stored only as bcrypt hashes (cost 10) and `passwordHash` shall never be returned by the API. The JWT signing secret shall come only from the `JWT_SECRET` environment variable; the API shall refuse to issue a token if it is not set. | Test T-44, test `auth.secret.test.ts`, code review of `auth.service.ts`. |
| NFR-3 | Security | Role checks shall be enforced on the server by middleware on every write and report endpoint. The UI hiding a button is never the only protection. | Tests T-06, T-25. |
| NFR-4 | Security, reliability | Request bodies, parameters and queries shall be validated with the shared zod schemas. Invalid input shall give `400 VALIDATION_ERROR` with details. Unexpected server errors shall give a generic `500 INTERNAL_ERROR` with no stack trace. | Tests T-09, T-20, T-27, malformed-JSON test; `errorHandler.ts`. |
| NFR-5 | Usability | The two core tasks (search then use a component, add a component with keywords) shall take no more than three screens. The public pages shall be operable by keyboard alone, use labelled form controls, and show no violations in an automated axe accessibility scan. | E2E T-41, T-42, T-45 (axe scan of `/`, `/search`, `/browse`, `/login`, `/register`; keyboard-only search flow). Not verified: console pages, a 360 px layout, manual contrast checks. |
| NFR-6 | Reliability | `GET /health` shall report whether the API and the database are reachable (`ok`, or `degraded` when the database is down). | Test T-01. |
| NFR-7 | Maintainability | The code shall be strict TypeScript with clean ESLint and Prettier, and the backend shall be layered (routes, controllers, services; Prisma only in services). Services shall have at least 80% line coverage. Every push shall run lint, format check, type check, tests, the web build and the E2E suite in CI. | CI workflow, coverage thresholds in `apps/api/vitest.config.ts`. |
| NFR-8 | Data integrity | Counter updates and cascading deletes shall be atomic (one database transaction each), and counters shall never go below 0. | Tests T-26, T-11, T-24. |
| NFR-9 | Portability | The system shall run on Node 22 with all configuration supplied by environment variables and no OS-specific code. | Run on Windows locally and on Linux in CI. |
| NFR-10 | Security | Registration and login shall be limited to 20 requests per IP per 15 minutes; further requests get `429 RATE_LIMITED`. The counter is kept in process memory, so it resets on restart and is not shared between serverless instances. | Auth test "rate limits auth routes when enabled". |
| NFR-11 | Security | The API shall send CORS headers only to browser origins listed in `WEB_ORIGIN`, to `http://localhost:*` and to `*.vercel.app`, and to any origin if `WEB_ORIGIN` is unset or contains `*`. Requests with no `Origin` header are unaffected. | Checked over HTTP for allowed and unknown origins; `app.ts`. |

## Appendix A. Problem statement sentences

| # | Sentence (abridged) | FRs |
|---|---|---|
| S1 | The software consists of a components catalogue and various functions defined on it. | FR-1 |
| S2 | The catalogue should hold details of the components which are potentially reusable. | FR-2, FR-3, FR-27 |
| S3 | The reusable components can be either design or code. | FR-4 |
| S4 | The design might use different design notations such as UML, ERD, structured design, etc. | FR-5, FR-7 |
| S5 | The code might be written using different programming languages. | FR-6, FR-7 |
| S6 | A cataloguer may enter components, delete components, and associate keywords. | FR-8 to FR-13, FR-22 |
| S7 | A user may query the availability of a component using key words. | FR-13 to FR-16 |
| S8 | To help purge unused components, maintain how many times a component was used and how many times it came up in a query but was not used. | FR-17 to FR-22 |
| S9 | It is desirable to classify the different types of components hierarchically. | FR-23, FR-24, FR-25 |
| S10 | A user should be able to browse the components in each category. | FR-3, FR-25, FR-26, FR-27 |
