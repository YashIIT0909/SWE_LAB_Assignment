# Design

Data model names, API paths and counter rules are defined in `CLAUDE.md`; this document shows
how they fit together.

## 1. Architecture

```mermaid
flowchart LR
    B["Browser"]
    subgraph vercel["Vercel"]
        W["Next.js web app (apps/web) - App Router, TanStack Query"]
        A["Express API (apps/api) - serverless function, /api/v1"]
    end
    N[("Supabase PostgreSQL")]

    B -- "HTTPS: pages, assets" --> W
    B -- "HTTPS JSON + Bearer JWT" --> A
    W -. "server components fetch (public reads)" .-> A
    A -- "Prisma over TLS (pooled connection)" --> N
```

- The browser calls the API directly for authenticated and mutating requests (token kept in
  memory + `localStorage`); Next.js server components may call public read endpoints for SSR.
- CORS on the API allows the origins in `WEB_ORIGIN`, `http://localhost:*` and `*.vercel.app` (everything if
  `WEB_ORIGIN` is unset or contains `*`); other browsers' origins get no CORS headers.
- Supabase's pooled connection string (`DATABASE_URL`, Supavisor port 6543 with
  `?pgbouncer=true`) is used at runtime; the direct string (port 5432)
  (`DIRECT_URL`) is used by `prisma migrate`.
- `packages/shared` is compiled into both apps: zod schemas are the single definition of
  request shapes, and the web forms reuse them for client-side validation.

## 2. Layered backend design

```mermaid
flowchart TB
    R["Routes - routers per resource, mount under /api/v1"]
    MW["Middleware - json, cors, authenticate, requireLogin / requireCataloguer, rateLimit, errorHandler"]
    C["Controllers - parse dto with shared zod schema, call service, shape response"]
    S["Services - business rules, transactions, counters, audit"]
    P["Prisma client (lib/prisma.ts)"]
    DB[("PostgreSQL")]
    SH["packages/shared - zod schemas, types, constants"]

    R --> MW --> C --> S --> P --> DB
    C -. "imports" .-> SH
    S -. "imports types" .-> SH
```

| Layer | Responsibility | May import |
|---|---|---|
| routes | HTTP method + path -> middleware chain -> controller | middleware, controllers |
| middleware | auth (JWT -> `req.user`), role check, rate limit, error -> JSON shape | services (`verifyToken` only), errors |
| controllers | parse `req` with the shared zod schema (there is no separate validate middleware), call the service, `res.status().json()` | services, shared |
| services | all logic; `prisma.$transaction` for multi-write operations; throw `AppError` | prisma, shared, errors |
| lib/prisma | single `PrismaClient` instance | - |

Source layout (as built):

```
apps/api/src/
  app.ts                 express app (no listen) used by tests and the Vercel handler
  index.ts               local dev server
  serverless.ts          Vercel handler
  routes/{auth,categories,components,health,keywords,notations,reports,search}.ts
  controllers/{auth,category,component,keyword,notation,report,search}.controller.ts
  services/{audit,auth,category,component,health,keyword,notation,report,search,usage}.service.ts
  middleware/{auth,errorHandler,rateLimit}.ts
  lib/prisma.ts  errors.ts
apps/api/prisma/{schema.prisma, seed.ts, migrations/}
apps/web/app/            (public) /, /search, /browse/[[...id]], /components/[id], /login, /register
                         (console) /console (reports dashboard), /console/components,
                                   /console/categories, /console/notations, /console/purge,
                                   /console/audit
packages/shared/src/{schemas,types,constants}.ts
```

## 3. ER diagram

```mermaid
erDiagram
    User {
        String id PK "cuid"
        String name
        String email UK
        String passwordHash
        Role role "CATALOGUER or USER"
        DateTime createdAt
    }
    Category {
        String id PK "cuid"
        String name "unique with parentId"
        String slug
        String description "optional"
        String parentId FK "optional, self"
        DateTime createdAt
        DateTime updatedAt
    }
    Notation {
        String id PK "cuid"
        String name UK
        ComponentKind kind "DESIGN or CODE"
    }
    Component {
        String id PK "cuid"
        String name
        String description
        ComponentKind kind "must equal notation.kind"
        String notationId FK
        String categoryId FK
        String version "default 1.0.0"
        String author "optional"
        String sourceUrl "optional"
        String content "optional, text"
        String createdById FK
        Int useCount "default 0"
        Int queryHitCount "default 0"
        Int queryHitNotUsedCount "default 0"
        DateTime lastUsedAt "optional"
        DateTime createdAt
        DateTime updatedAt
    }
    Keyword {
        String id PK "cuid"
        String term UK "trimmed, lowercase"
    }
    ComponentKeyword {
        String componentId PK, FK "cascade on component delete"
        String keywordId PK, FK
    }
    SearchQuery {
        String id PK "cuid"
        String userId FK "optional"
        String[] terms
        Json filters
        Int resultCount
        DateTime createdAt
    }
    SearchResult {
        String queryId PK, FK
        String componentId PK, FK "cascade on component delete"
        Int rank
        Boolean used "default false"
    }
    UsageEvent {
        String id PK "cuid"
        String componentId FK "cascade on component delete"
        String userId FK "optional"
        String queryId FK "optional"
        DateTime createdAt
    }
    AuditLog {
        String id PK "cuid"
        String actorId FK
        String action
        String entityType
        String entityId
        Json details "optional"
        DateTime createdAt
    }

    User ||--o{ Component : "creates"
    User |o--o{ SearchQuery : "runs"
    User |o--o{ UsageEvent : "performs"
    User ||--o{ AuditLog : "acts in"
    Category |o--o{ Category : "parent of"
    Category ||--o{ Component : "classifies"
    Notation ||--o{ Component : "expresses"
    Component ||--o{ ComponentKeyword : "tagged by"
    Keyword ||--o{ ComponentKeyword : "tags"
    SearchQuery ||--o{ SearchResult : "returns"
    Component ||--o{ SearchResult : "appears in"
    Component ||--o{ UsageEvent : "used in"
    SearchQuery |o--o{ UsageEvent : "leads to"
```

Indexes planned: `Component(categoryId)`, `Component(notationId)`,
`Component(kind)`, `ComponentKeyword(keywordId)`, `Keyword(term)` (unique, also used with
`text_pattern_ops` for prefix search), `UsageEvent(componentId)`, `AuditLog(createdAt)`.

## 4. Class diagrams

Two class diagrams, both drawn in PlantUML (sources and exports in `diagrams/`, see
`diagrams/README.md`): the **domain model** (the data the system stores) and the **backend design**
(the code that works on it).

### 4.1 Domain model

![Domain class diagram](diagrams/class-domain.png)

Source: `diagrams/class-domain.puml`, derived from `apps/api/prisma/schema.prisma`. Attributes show
the stored type; `[0..1]` marks optional fields. The two enumerations `Role` and `ComponentKind` are
used as attribute types (`User.role`, `Notation.kind`, `Component.kind`).

| Relationship | UML kind | Multiplicity | Why it is drawn this way |
|---|---|---|---|
| User creates Component | association | 1 to 0..* | `Component.createdById` is required. |
| Category classifies Component | association | 1 to 0..* | `Component.categoryId` is required, so a component is in exactly one category. |
| Notation expresses Component | association | 1 to 0..* | `Component.notationId` is required; the kind of the notation must equal the kind of the component (checked in the service). |
| Category has parent / children | aggregation, self-association | 0..1 parent to 0..* children | A category groups sub-categories, but a parent cannot be deleted while it still has children: they are reassigned first (`CATEGORY_NOT_EMPTY`). The children live on, so this is aggregation and not composition. |
| Component described by Keyword | many-to-many with association class `ComponentKeyword` | 0..* to 0..* | The link row has its own identity (`componentId`, `keywordId`) and is deleted with the component (cascade). |
| SearchQuery returns Component | many-to-many with association class `SearchResult` | 0..* to 0..* | The link carries data of its own, `rank` and `used`; it is what the "hit not used" counter is built from. It is deleted with either end (cascade). |
| Component has UsageEvent | composition | 1 to 0..* | A usage event has no meaning without its component and is deleted with it (cascade). |
| User runs SearchQuery, User triggers UsageEvent | association | 0..1 to 0..* | `userId` is optional: anonymous visitors can search, and the rows survive when a user is deleted (`SetNull`). |
| SearchQuery led to UsageEvent | association | 0..1 to 0..* | `queryId` is optional: a use may come from a search or from a detail page. |
| User performs AuditLog | association | 1 to 0..* | `AuditLog.actorId` is required. |

There is no inheritance in the domain model. `Role` is an attribute of `User`, not a subclass, because
the two kinds of user have the same data and differ only in what they may do.

### 4.2 Backend design

![Backend class diagram](diagrams/class-backend.png)

Source: `diagrams/class-backend.puml`. A request goes routes, then middleware, controllers, services
and the database, as in section 2. The arrows are the real imports:

- Routes attach middleware (`authenticate` globally, `requireLogin` / `requireCataloguer` per route,
  `rateLimit` on the two auth routes) and call one controller. The health route calls `HealthService`
  directly and has no controller.
- `auth` middleware depends on `AuthService.verifyToken` to turn the Bearer token into `req.user`.
- Controllers call services. Two controllers call two services each: `ComponentController` (component and
  keyword) and `SearchController` (search and usage).
- Service-to-service dependencies: `ComponentService` uses `CategoryService` (existence check,
  breadcrumb, descendants), `SearchService` uses `ComponentService` (category filter, result summary),
  and every service that writes to the catalogue calls `AuditService.audit` inside its own transaction.
- `AuditService.audit` receives the caller's transaction client, so it does not import Prisma. Every other
  service imports the single `PrismaClient` and throws `AppError` for business errors.

The services are **modules of exported functions**, not classes with state. They are drawn as
`«service»` classes because the diagram shows what each module offers and what it depends on. The
`+` operations are the exported functions.

Notation management sits in its own `NotationService` (create and list), and reports and the audit
log are both in `ReportService`.

## 5. Sequence diagrams

### 5.1 Keyword search

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web app
    participant API as SearchController
    participant S as SearchService
    participant C as ComponentService
    participant DB as PostgreSQL

    U->>W: enter keywords, match, filters
    W->>API: POST /api/v1/search
    API->>API: validate body with shared zod schema
    alt invalid
        API-->>W: 400 VALIDATION_ERROR
    else valid
        API->>S: search(dto, userId?)
        opt categoryId and includeDescendants
            S->>C: categoryFilter(categoryId, includeDescendants)
            C-->>S: category ids (the category, plus its descendants if requested)
        end
        S->>DB: find components with keywords matching terms (equal or prefix) and filters
        DB-->>S: candidates with keywords
        S->>S: score, filter by match mode, order by score, useCount, name
        S->>S: slice requested page
        S->>DB: BEGIN transaction
        S->>DB: insert SearchQuery(terms, filters, resultCount)
        S->>DB: insert SearchResult per page item (rank)
        S->>DB: update page components set queryHitCount+1, queryHitNotUsedCount+1
        S->>DB: COMMIT
        S-->>API: queryId, items, page, pageSize, total
        API-->>W: 200 JSON
        W-->>U: ranked results with matched keywords
    end
```

### 5.2 Use component

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web app
    participant API as SearchController
    participant S as UsageService
    participant DB as PostgreSQL

    U->>W: click Use this component
    W->>API: POST /api/v1/components/ID/use with queryId (Bearer JWT)
    API->>API: authenticate
    alt no or invalid token
        API-->>W: 401 UNAUTHENTICATED
    else logged in
        API->>S: use(componentId, userId, queryId?)
        S->>DB: BEGIN transaction
        S->>DB: find component
        alt not found
            S-->>API: NOT_FOUND
            API-->>W: 404
        else found
            opt queryId given
                S->>DB: update SearchResult set used=true where queryId, componentId, used=false
                alt one row updated
                    S->>DB: decrement queryHitNotUsedCount where value > 0
                end
            end
            S->>DB: update component useCount+1, lastUsedAt=now
            S->>DB: insert UsageEvent(componentId, userId, queryId)
            S->>DB: COMMIT
            S-->>API: counters
            API-->>W: 200 counters
            W-->>U: confirmation, show content
        end
    end
```

### 5.3 Add component with keywords

```mermaid
sequenceDiagram
    actor C as Cataloguer
    participant W as Web console
    participant API as ComponentController
    participant S as ComponentService
    participant DB as PostgreSQL

    C->>W: fill form, add keyword chips
    W->>API: GET /api/v1/keywords?prefix=...
    API-->>W: suggestions
    C->>W: submit
    W->>API: POST /api/v1/components (Bearer JWT)
    API->>API: authenticate, requireCataloguer, parse body with zod (keywords trimmed, lowercased, de-duplicated)
    API->>S: create(dto, actor)
    S->>DB: load notation and category
    alt missing
        S-->>API: NOT_FOUND
    else notation.kind differs from dto.kind
        S-->>API: NOTATION_KIND_MISMATCH
    else ok
        S->>DB: BEGIN transaction
        S->>DB: insert Component with its keywords (Keyword rows found or created per term, ComponentKeyword rows)
        S->>DB: insert AuditLog COMPONENT_CREATE
        S->>DB: COMMIT
        S-->>API: component with keywords
        API-->>W: 201 Created
        W-->>C: detail page
    end
```

### 5.4 Purge

```mermaid
sequenceDiagram
    actor C as Cataloguer
    participant W as Web console
    participant API as ReportController
    participant S as ReportService
    participant DB as PostgreSQL

    C->>W: set criteria
    W->>API: GET /api/v1/reports/purge-candidates?maxUses=0&unusedForDays=90
    API->>S: purgeCandidates(params)
    S->>DB: select components matching criteria
    DB-->>S: rows
    S-->>API: candidates
    API-->>W: 200 list
    C->>W: select ids and confirm
    W->>API: POST /api/v1/reports/purge with componentIds and params
    API->>S: purge(ids, params, actor)
    S->>DB: BEGIN transaction
    S->>DB: select ids that still match criteria
    S->>DB: delete those components (cascade links, results, events)
    S->>DB: insert AuditLog COMPONENT_PURGE per deleted id
    S->>DB: COMMIT
    S-->>API: deleted ids, skipped ids
    API-->>W: 200 result
    W-->>C: summary of purge
```

## 6. Component lifecycle (state diagram)

The state is derived from counters and purge criteria; it is not stored as a column.

```mermaid
stateDiagram-v2
    [*] --> Catalogued : cataloguer adds
    Catalogued --> Retrieved : shown in search results
    Retrieved --> Retrieved : shown again
    Retrieved --> Used : user marks used
    Catalogued --> Used : used from browse
    Used --> Used : used again
    Used --> Retrieved : shown in later search
    Catalogued --> PurgeCandidate : meets purge criteria
    Retrieved --> PurgeCandidate : meets purge criteria
    Used --> PurgeCandidate : unused for too long
    PurgeCandidate --> Used : used before purge
    PurgeCandidate --> Deleted : cataloguer purges
    Catalogued --> Deleted : cataloguer deletes
    Retrieved --> Deleted : cataloguer deletes
    Used --> Deleted : cataloguer deletes
    Deleted --> [*]

    state "Purge candidate" as PurgeCandidate
```

## 7. Activity diagram — cataloguing a component

```mermaid
flowchart TD
    start(("Start"))
    login{"Logged in as cataloguer?"}
    doLogin["Log in"]
    open["Open New component form"]
    kind["Choose kind: Design or Code"]
    notation["Pick notation filtered by kind"]
    catExists{"Suitable category exists?"}
    newCat["Create category (UC-9)"]
    pickCat["Pick category"]
    details["Enter name, description, version, author, source URL, content"]
    kw["Add keywords with autocomplete"]
    submit["Submit"]
    valid{"Input valid and notation kind matches?"}
    showErr["Show errors"]
    save["Save component, keywords and audit entry in one transaction"]
    detail["Show component detail"]
    more{"Catalogue another?"}
    stop(("End"))

    start --> login
    login -- "no" --> doLogin --> login
    login -- "yes" --> open --> kind --> notation --> catExists
    catExists -- "no" --> newCat --> pickCat
    catExists -- "yes" --> pickCat
    pickCat --> details --> kw --> submit --> valid
    valid -- "no" --> showErr --> details
    valid -- "yes" --> save --> detail --> more
    more -- "yes" --> open
    more -- "no" --> stop
```
