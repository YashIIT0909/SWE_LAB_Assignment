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
- CORS on the API allows only `WEB_ORIGIN`.
- Supabase's pooled connection string (`DATABASE_URL`, Supavisor port 6543 with
  `?pgbouncer=true`) is used at runtime; the direct string (port 5432)
  (`DIRECT_URL`) is used by `prisma migrate`.
- `packages/shared` is compiled into both apps: zod schemas are the single definition of
  request shapes, and the web forms reuse them for client-side validation.

## 2. Layered backend design

```mermaid
flowchart TB
    R["Routes - routers per resource, mount under /api/v1"]
    MW["Middleware - json, cors, authenticate, requireRole, validate, errorHandler"]
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
| middleware | auth (JWT -> `req.user`), role check, zod validation, error -> JSON shape | shared, errors |
| controllers | read `req`, call exactly one service method, `res.status().json()` | services, shared |
| services | all logic; `prisma.$transaction` for multi-write operations; throw `AppError` | prisma, shared, errors |
| lib/prisma | single `PrismaClient` instance | - |

Planned source layout:

```
apps/api/src/
  app.ts                 express app (no listen) used by tests and the Vercel handler
  index.ts               local dev server
  routes/{auth,categories,notations,components,keywords,search,reports}.ts
  controllers/*.controller.ts
  services/{auth,category,notation,component,keyword,search,usage,report,audit}.service.ts
  middleware/{authenticate,requireRole,validate,errorHandler}.ts
  lib/prisma.ts  errors.ts
apps/api/prisma/{schema.prisma, seed.ts, migrations/}
apps/web/app/            (public) /, /search, /browse/[[...id]], /components/[id], /login, /register
                         (console) /console/components, /console/categories, /console/notations,
                                   /console/reports, /console/purge, /console/audit
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

## 4. Class diagram

```mermaid
classDiagram
    direction LR
    class User {
        +String id
        +String name
        +String email
        +String passwordHash
        +Role role
        +DateTime createdAt
    }
    class Category {
        +String id
        +String name
        +String slug
        +String description
        +String parentId
        +DateTime createdAt
        +DateTime updatedAt
    }
    class Notation {
        +String id
        +String name
        +ComponentKind kind
    }
    class Component {
        +String id
        +String name
        +String description
        +ComponentKind kind
        +String notationId
        +String categoryId
        +String version
        +String author
        +String sourceUrl
        +String content
        +String createdById
        +int useCount
        +int queryHitCount
        +int queryHitNotUsedCount
        +DateTime lastUsedAt
        +DateTime createdAt
        +DateTime updatedAt
    }
    class Keyword {
        +String id
        +String term
    }
    class SearchQuery {
        +String id
        +String userId
        +String[] terms
        +Json filters
        +int resultCount
        +DateTime createdAt
    }
    class SearchResult {
        +String queryId
        +String componentId
        +int rank
        +boolean used
    }
    class UsageEvent {
        +String id
        +String componentId
        +String userId
        +String queryId
        +DateTime createdAt
    }
    class AuditLog {
        +String id
        +String actorId
        +String action
        +String entityType
        +String entityId
        +Json details
        +DateTime createdAt
    }

    class AuthService {
        +register(dto) AuthResult
        +login(dto) AuthResult
        +me(userId) User
        +verifyToken(token) TokenPayload
    }
    class CategoryService {
        +tree() CategoryNode[]
        +get(id) CategoryDetail
        +listComponents(id, query) Page
        +create(dto, actor) Category
        +update(id, dto, actor) Category
        +remove(id, reassignTo, actor) void
        +descendantIds(id) String[]
    }
    class ComponentService {
        +list(query) Page
        +get(id) ComponentDetail
        +create(dto, actor) Component
        +update(id, dto, actor) Component
        +remove(id, actor) void
        +createNotation(dto, actor) Notation
        +listNotations(kind) Notation[]
    }
    class KeywordService {
        +normalise(terms) String[]
        +replace(componentId, terms, actor) Keyword[]
        +add(componentId, terms, actor) Keyword[]
        +remove(componentId, keywordId, actor) void
        +suggest(prefix, limit) Keyword[]
    }
    class SearchService {
        +search(dto, userId) SearchPage
        -score(terms, keywords) int
    }
    class UsageService {
        +use(componentId, userId, queryId) Counters
    }
    class ReportService {
        +summary() Summary
        +purgeCandidates(params) Component[]
        +purge(ids, params, actor) PurgeResult
        +audit(page, pageSize) Page
    }

    User "1" --> "*" Component : creates
    Category "0..1" --> "*" Category : parent of
    Category "1" --> "*" Component : classifies
    Notation "1" --> "*" Component : expresses
    Component "*" -- "*" Keyword : ComponentKeyword
    SearchQuery "1" *-- "*" SearchResult
    Component "1" --> "*" SearchResult
    Component "1" *-- "*" UsageEvent
    User "1" --> "*" AuditLog : actor

    AuthService ..> User
    CategoryService ..> Category
    CategoryService ..> AuditLog
    ComponentService ..> Component
    ComponentService ..> Notation
    ComponentService ..> KeywordService
    ComponentService ..> AuditLog
    KeywordService ..> Keyword
    SearchService ..> CategoryService
    SearchService ..> SearchQuery
    SearchService ..> SearchResult
    SearchService ..> Component
    UsageService ..> UsageEvent
    UsageService ..> SearchResult
    UsageService ..> Component
    ReportService ..> Component
    ReportService ..> AuditLog
```

Notation management lives in `ComponentService` (it is only a lookup table); audit writes are a
small helper called inside each service's transaction.

## 5. Sequence diagrams

### 5.1 Keyword search

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web app
    participant API as SearchController
    participant S as SearchService
    participant C as CategoryService
    participant DB as PostgreSQL

    U->>W: enter keywords, match, filters
    W->>API: POST /api/v1/search
    API->>API: validate body with shared zod schema
    alt invalid
        API-->>W: 400 VALIDATION_ERROR
    else valid
        API->>S: search(dto, userId?)
        opt categoryId and includeDescendants
            S->>C: descendantIds(categoryId)
            C-->>S: category ids
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
    participant API as ComponentController
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
    participant K as KeywordService
    participant DB as PostgreSQL

    C->>W: fill form, add keyword chips
    W->>API: GET /api/v1/keywords?prefix=...
    API-->>W: suggestions
    C->>W: submit
    W->>API: POST /api/v1/components (Bearer JWT)
    API->>API: authenticate, requireRole CATALOGUER, validate
    API->>S: create(dto, actor)
    S->>DB: load notation and category
    alt missing
        S-->>API: NOT_FOUND
    else notation.kind differs from dto.kind
        S-->>API: NOTATION_KIND_MISMATCH
    else ok
        S->>DB: BEGIN transaction
        S->>DB: insert Component
        S->>K: normalise(keywords)
        K-->>S: unique lowercase terms
        S->>DB: upsert Keyword per term
        S->>DB: insert ComponentKeyword rows
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
