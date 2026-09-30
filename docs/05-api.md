# API Contract

Base URL: `https://<api-host>/api/v1` (local: `http://localhost:4000/api/v1`).
All bodies are JSON. Authenticated requests send `Authorization: Bearer <token>`.
Auth levels: **public** (token optional; if present it is used, e.g. to link a search to the
user), **login** (any valid token), **cataloguer** (role `CATALOGUER`).

## Common rules

### Errors

Every non-2xx response has this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": ["keywords"], "message": "Array must contain at least 1 element(s)" }]
  }
}
```

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body, params or query fail the zod schema. `details` = zod issues. |
| `INVALID_CREDENTIALS` | 401 | Login email/password wrong. |
| `UNAUTHENTICATED` | 401 | Missing, malformed or expired token on a login/cataloguer endpoint. |
| `FORBIDDEN` | 403 | Valid token but role is not `CATALOGUER`. |
| `NOT_FOUND` | 404 | Referenced resource does not exist (also unknown routes). |
| `RATE_LIMITED` | 429 | More than 20 `POST /auth/register` or `POST /auth/login` requests from one IP in 15 minutes. Sends `Retry-After`. |
| `EMAIL_TAKEN` | 409 | Register with an existing email. |
| `DUPLICATE_NAME` | 409 | Notation name exists; sibling category with same name exists. |
| `CATEGORY_NOT_EMPTY` | 409 | Delete a category with children or components and no `reassignTo`. |
| `CATEGORY_CYCLE` | 409 | Move a category under itself/descendant, or reassign into the deleted subtree. |
| `NOTATION_KIND_MISMATCH` | 422 | `notation.kind` differs from component `kind`. |
| `INTERNAL_ERROR` | 500 | Unexpected error (message is generic; details logged server-side only). |

Every endpoint can return `VALIDATION_ERROR` and `INTERNAL_ERROR`; every login endpoint can
return `UNAUTHENTICATED`; every cataloguer endpoint can additionally return `FORBIDDEN`. The
per-endpoint tables below list the remaining codes.

### Security rules

- **JWT secret:** tokens are signed (HS256) with `JWT_SECRET`. The API has no default; without the
  variable it cannot issue a token.
- **CORS:** the API sends CORS headers only to origins listed in `WEB_ORIGIN` (comma separated), to
  `http://localhost:*` and to `*.vercel.app`. If `WEB_ORIGIN` is unset or contains `*`, every origin is
  allowed. Requests with no `Origin` header (curl, server to server) are not affected.
- **Rate limit:** `POST /auth/register` and `POST /auth/login` allow 20 requests per IP per 15
  minutes, then return `429 RATE_LIMITED`. The counter lives in process memory.

### Pagination

Query (or body for `/search`): `page` (integer >= 1, default 1), `pageSize` (1..50, default 20).
Response:

```json
{ "items": [], "page": 1, "pageSize": 20, "total": 0 }
```

A page beyond the last returns `items: []` with the real `total`.

### Shared shapes

**ComponentSummary** (used in lists and search results):

```json
{
  "id": "cm1comp0001",
  "name": "Observer pattern class diagram",
  "description": "UML class diagram of the Observer pattern with Subject and Observer interfaces.",
  "kind": "DESIGN",
  "version": "1.0.0",
  "author": "A. Sharma",
  "sourceUrl": "https://example.org/observer.puml",
  "notation": { "id": "cm1not0001", "name": "UML", "kind": "DESIGN" },
  "category": { "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns" },
  "keywords": [{ "id": "cm1kw0001", "term": "observer" }, { "id": "cm1kw0002", "term": "event" }],
  "useCount": 4,
  "queryHitCount": 12,
  "queryHitNotUsedCount": 8,
  "lastUsedAt": "2026-09-20T10:15:00.000Z",
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-09-01T08:00:00.000Z"
}
```

**ComponentDetail** = ComponentSummary + `content`, `createdBy: {id, name}`, and
`category.breadcrumb: [{id, name, slug}]` (root first, including the category itself).

`sort` for component lists: `name` (name asc, default), `newest` (createdAt desc),
`mostUsed` (useCount desc, then name asc).

---

## Health

### GET /health — public

Response `200`:

```json
{ "status": "ok", "db": "ok", "time": "2026-09-29T12:00:00.000Z" }
```

If the database ping fails the response is `503` with `{ "status": "degraded", "db": "down", ... }`
(not the error shape, so monitors can read it).

---

## Auth

### POST /auth/register — public

Request:

```json
{ "name": "Priya Nair", "email": "priya@example.com", "password": "s3cretpass" }
```

Rules: name 1..100, valid email (stored lowercase), password 8..72. Any `role` field is ignored;
the account is always `USER`.

Response `201`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "cm1usr0010", "name": "Priya Nair", "email": "priya@example.com", "role": "USER", "createdAt": "2026-09-29T12:00:00.000Z" }
}
```

Errors: `EMAIL_TAKEN`.

### POST /auth/login — public

Request: `{ "email": "cat@sccs.local", "password": "changeme123" }`
Response `200`: same shape as register (role may be `CATALOGUER`).
Errors: `INVALID_CREDENTIALS`.

### GET /auth/me — login

Response `200`: `{ "user": { "id": "...", "name": "...", "email": "...", "role": "USER", "createdAt": "..." } }`
Errors: `UNAUTHENTICATED` (also when the user in the token no longer exists).

---

## Categories

### GET /categories/tree — public

Response `200` — roots ordered by name, children nested; `componentCount` is direct,
`totalComponentCount` includes descendants:

```json
{
  "items": [
    {
      "id": "cm1cat0001", "name": "Design patterns", "slug": "design-patterns", "description": null,
      "componentCount": 0, "totalComponentCount": 7,
      "children": [
        { "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns", "description": null,
          "componentCount": 7, "totalComponentCount": 7, "children": [] }
      ]
    }
  ]
}
```

### GET /categories/:id — public

Response `200`:

```json
{
  "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns",
  "description": "Observer, Strategy, Command ...", "parentId": "cm1cat0001",
  "createdAt": "2026-09-01T08:00:00.000Z", "updatedAt": "2026-09-01T08:00:00.000Z",
  "breadcrumb": [
    { "id": "cm1cat0001", "name": "Design patterns", "slug": "design-patterns" },
    { "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns" }
  ],
  "children": [],
  "componentCount": 7
}
```

Errors: `NOT_FOUND`.

### GET /categories/:id/components — public

Query: `includeDescendants` (`true`|`false`, default `false`), `page`, `pageSize`, `sort`.
Example: `GET /categories/cm1cat0001/components?includeDescendants=true&sort=mostUsed&page=1&pageSize=20`
Response `200`: paginated `ComponentSummary`. Does not change counters.
Errors: `NOT_FOUND`.

### POST /categories — cataloguer

Request: `{ "name": "Creational patterns", "description": "Factory, Builder ...", "parentId": "cm1cat0001" }`
(`parentId` omitted or `null` = root). Slug is derived from the name.
Response `201`: the category (same fields as `GET /categories/:id` without breadcrumb/children).
Errors: `NOT_FOUND` (parent), `DUPLICATE_NAME` (same name under same parent, including root).

### PATCH /categories/:id — cataloguer

Request (all optional, at least one): `{ "name": "...", "description": "...", "parentId": "cm1cat0002" | null }`
Response `200`: the updated category.
Errors: `NOT_FOUND`, `DUPLICATE_NAME`, `CATEGORY_CYCLE`.

### DELETE /categories/:id?reassignTo=<id> — cataloguer

- Empty category (no children, no components): deleted; `reassignTo` not needed.
- Non-empty with `reassignTo`: child categories and components move to `reassignTo`, then the
  category is deleted (one transaction).

Response `200`: `{ "deletedId": "cm1cat0004", "movedComponents": 3, "movedChildren": 1, "reassignedTo": "cm1cat0001" }`
Errors: `NOT_FOUND` (category or target), `CATEGORY_NOT_EMPTY`, `CATEGORY_CYCLE` (target is the
category or one of its descendants), `DUPLICATE_NAME` (a moved child clashes with a sibling name
under the target).

---

## Notations

### GET /notations?kind — public

Query: `kind` (`DESIGN`|`CODE`, optional). Ordered by name.
Response `200`:

```json
{ "items": [ { "id": "cm1not0001", "name": "UML", "kind": "DESIGN" }, { "id": "cm1not0002", "name": "ERD", "kind": "DESIGN" } ] }
```

### POST /notations — cataloguer

Request: `{ "name": "Rust", "kind": "CODE" }`
Response `201`: `{ "id": "cm1not0011", "name": "Rust", "kind": "CODE" }`
Errors: `DUPLICATE_NAME` (case-insensitive).

---

## Components

### GET /components — public

Query: `kind`, `notationId`, `categoryId`, `includeDescendants` (applies with `categoryId`),
`q` (case-insensitive substring of name or description, 1..100 chars), `sort`, `page`, `pageSize`.
Example: `GET /components?kind=CODE&notationId=cm1not0007&q=parser&sort=newest`
Response `200`: paginated `ComponentSummary`. Does **not** record a search or change counters.
Errors: `NOT_FOUND` (unknown `categoryId`).

### GET /components/:id — public

Response `200`: `ComponentDetail`:

```json
{
  "id": "cm1comp0001", "name": "Observer pattern class diagram", "description": "...",
  "kind": "DESIGN", "version": "1.0.0", "author": "A. Sharma", "sourceUrl": "https://example.org/observer.puml",
  "content": "@startuml\ninterface Subject { ... }\n@enduml",
  "notation": { "id": "cm1not0001", "name": "UML", "kind": "DESIGN" },
  "category": {
    "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns",
    "breadcrumb": [
      { "id": "cm1cat0001", "name": "Design patterns", "slug": "design-patterns" },
      { "id": "cm1cat0003", "name": "Behavioural patterns", "slug": "behavioural-patterns" }
    ]
  },
  "keywords": [{ "id": "cm1kw0001", "term": "observer" }],
  "createdBy": { "id": "cm1usr0001", "name": "Head Cataloguer" },
  "useCount": 4, "queryHitCount": 12, "queryHitNotUsedCount": 8,
  "lastUsedAt": "2026-09-20T10:15:00.000Z",
  "createdAt": "2026-09-01T08:00:00.000Z", "updatedAt": "2026-09-01T08:00:00.000Z"
}
```

Errors: `NOT_FOUND`.

### POST /components — cataloguer

Request:

```json
{
  "name": "CSV parser",
  "description": "Streaming RFC 4180 CSV parser with quoted field support.",
  "kind": "CODE",
  "notationId": "cm1not0007",
  "categoryId": "cm1cat0010",
  "version": "2.1.0",
  "author": "R. Iyer",
  "sourceUrl": "https://github.com/example/csv-parser",
  "content": "export function parse(input: string) { ... }",
  "keywords": ["CSV", " parser ", "stream"]
}
```

Required: `name` (1..120), `description` (1..5000), `kind`, `notationId`, `categoryId`.
Optional: `version` (default `"1.0.0"`), `author`, `sourceUrl` (http/https URL), `content`
(<= 100,000 chars), `keywords` (0..50 terms, each 1..50 chars; normalised to
`["csv", "parser", "stream"]`). Counters cannot be set by the client.
Response `201`: `ComponentDetail` with counters at 0.
Errors: `NOT_FOUND` (notation or category), `NOTATION_KIND_MISMATCH`.

### PATCH /components/:id — cataloguer

Request: any subset of the create fields except `keywords` (use the keyword endpoints), at least one.
`author`, `sourceUrl`, `content` may be `null` to clear.

```json
{ "version": "2.2.0", "description": "Now supports custom delimiters." }
```

Response `200`: `ComponentDetail`.
Errors: `NOT_FOUND` (component, notation or category), `NOTATION_KIND_MISMATCH` (checked
against the resulting kind and notation).

### DELETE /components/:id — cataloguer

Response `204` (no body). Cascades `ComponentKeyword`, `SearchResult`, `UsageEvent`; writes
`COMPONENT_DELETE` audit row with `{ name }` in details.
Errors: `NOT_FOUND`.

---

## Component keywords

All three return the component's resulting keyword list:
`{ "componentId": "cm1comp0002", "keywords": [{ "id": "cm1kw0010", "term": "csv" }] }`
(ordered by term) and write a `KEYWORDS_UPDATE` audit row.

### PUT /components/:id/keywords — cataloguer

Replace the whole set. Request: `{ "keywords": ["csv", "parser", "tabular"] }` (0..50 terms;
empty array clears). Response `200`.
Errors: `NOT_FOUND`.

### POST /components/:id/keywords — cataloguer

Add terms (existing links are kept, duplicates ignored). Request: `{ "keywords": ["rfc4180"] }`
(1..50 terms). Response `200`.
Errors: `NOT_FOUND`.

### DELETE /components/:id/keywords/:keywordId — cataloguer

Remove one link (the `Keyword` row is kept for other components). Response `200`.
Errors: `NOT_FOUND` (component, or keyword not linked to it).

---

## Keywords

### GET /keywords?prefix&limit — public

Query: `prefix` (0..50 chars, normalised; empty = most used keywords), `limit` (1..50, default 10).
Ordered by number of linked components desc, then term asc.
Response `200`:

```json
{ "items": [ { "id": "cm1kw0010", "term": "csv", "componentCount": 3 }, { "id": "cm1kw0014", "term": "css", "componentCount": 1 } ] }
```

---

## Search

### POST /search — public

Request:

```json
{
  "keywords": ["parser", "csv"],
  "match": "all",
  "kind": "CODE",
  "notationId": "cm1not0007",
  "categoryId": "cm1cat0010",
  "includeDescendants": true,
  "page": 1,
  "pageSize": 20
}
```

Rules: `keywords` 1..10 terms, each 1..50 chars after trim, normalised and de-duplicated;
`match` required; filters optional. Scoring per term: exact keyword = 2, keyword starting with a
term of length >= 3 = 1. `all` requires every term to score, `any` at least one. Order: score
desc, useCount desc, name asc.

Side effects (one transaction): a `SearchQuery` row (`userId` if a token was sent, `terms`,
`filters`, `resultCount = total`); for each item on the returned page a `SearchResult`
(`rank` = position in the full ordering, starting at 1) and `queryHitCount + 1`,
`queryHitNotUsedCount + 1`.

Response `200` (each item is a full `ComponentSummary` plus `matchedKeywords` and `score`;
summary fields abridged here):

```json
{
  "queryId": "cm1qry0042",
  "items": [
    { "id": "cm1comp0002", "name": "CSV parser", "useCount": 9,
      "matchedKeywords": ["csv", "parser"], "score": 4 },
    { "id": "cm1comp0007", "name": "CSV writer", "useCount": 2,
      "matchedKeywords": ["csv", "parsers"], "score": 3 }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 2
}
```

Errors: `NOT_FOUND` (unknown `notationId` or `categoryId`).

---

## Usage

### POST /components/:id/use — login

Request: `{ "queryId": "cm1qry0042" }` or `{}`.

Behaviour (one transaction): if `queryId` refers to a `SearchResult` for this component with
`used = false`, set `used = true` and `queryHitNotUsedCount - 1` (not below 0). Always
`useCount + 1`, `lastUsedAt = now`, insert `UsageEvent(componentId, userId, queryId?)`.
An unknown `queryId` or one that did not return this component is treated as a plain use.

Response `200`:

```json
{ "componentId": "cm1comp0002", "useCount": 10, "queryHitCount": 30, "queryHitNotUsedCount": 17, "lastUsedAt": "2026-09-29T12:05:00.000Z", "countedQueryHit": true }
```

`countedQueryHit` is `true` only when this call flipped a `SearchResult` to used.
Errors: `NOT_FOUND` (component).

---

## Reports

### GET /reports/summary — cataloguer

Response `200`:

```json
{
  "totals": { "components": 120, "design": 45, "code": 75, "categories": 18, "keywords": 310, "searches": 842, "uses": 377 },
  "byNotation": [ { "notationId": "cm1not0001", "name": "UML", "kind": "DESIGN", "components": 30 } ],
  "topUsed": [ { "id": "cm1comp0002", "name": "CSV parser", "useCount": 41 } ],
  "topNotUsed": [ { "id": "cm1comp0031", "name": "Legacy logger", "queryHitNotUsedCount": 57, "useCount": 0 } ],
  "neverUsedCount": 22
}
```

`topUsed` and `topNotUsed` hold at most 10 entries.

### GET /reports/purge-candidates — cataloguer

Query (integers >= 0): `maxUses` (default 0), `minNotUsedHits` (default 0), `unusedForDays`
(default 90), `olderThanDays` (default 30), plus `page`, `pageSize`.
Candidate = `useCount <= maxUses` AND `queryHitNotUsedCount >= minNotUsedHits` AND
(`lastUsedAt` is null OR `lastUsedAt < now - unusedForDays`) AND `createdAt < now - olderThanDays`.
Ordered by `queryHitNotUsedCount desc, createdAt asc`.

Response `200`:

```json
{
  "params": { "maxUses": 0, "minNotUsedHits": 5, "unusedForDays": 90, "olderThanDays": 30 },
  "items": [
    { "id": "cm1comp0031", "name": "Legacy logger", "kind": "CODE", "useCount": 0, "queryHitCount": 57,
      "queryHitNotUsedCount": 57, "lastUsedAt": null, "createdAt": "2026-03-02T09:00:00.000Z" }
  ],
  "page": 1, "pageSize": 20, "total": 1
}
```

### POST /reports/purge — cataloguer

Request:

```json
{ "componentIds": ["cm1comp0031", "cm1comp0044"], "params": { "maxUses": 0, "minNotUsedHits": 5, "unusedForDays": 90, "olderThanDays": 30 } }
```

`componentIds` 1..100 ids; `params` same fields and defaults as purge-candidates. The server
re-applies the criteria; only still-qualifying ids are deleted (cascade), each with a
`COMPONENT_PURGE` audit row (details: name, counters, params).

Response `200`:

```json
{ "deleted": ["cm1comp0031"], "skipped": [ { "id": "cm1comp0044", "reason": "NO_LONGER_CANDIDATE" } ] }
```

`reason` is `NOT_FOUND` or `NO_LONGER_CANDIDATE`. No endpoint-specific error codes.

### GET /reports/audit — cataloguer

Query: `page`, `pageSize`, optional `action`, `entityType`. Newest first.
Response `200`:

```json
{
  "items": [
    { "id": "cm1aud0100", "actor": { "id": "cm1usr0001", "name": "Head Cataloguer" }, "action": "COMPONENT_PURGE",
      "entityType": "Component", "entityId": "cm1comp0031", "details": { "name": "Legacy logger" },
      "createdAt": "2026-09-29T12:10:00.000Z" }
  ],
  "page": 1, "pageSize": 20, "total": 1
}
```

## Endpoint index

| Method | Path | Auth |
|---|---|---|
| GET | `/health` | public |
| POST | `/auth/register` | public |
| POST | `/auth/login` | public |
| GET | `/auth/me` | login |
| GET | `/categories/tree` | public |
| GET | `/categories/:id` | public |
| GET | `/categories/:id/components` | public |
| POST | `/categories` | cataloguer |
| PATCH | `/categories/:id` | cataloguer |
| DELETE | `/categories/:id` | cataloguer |
| GET | `/notations` | public |
| POST | `/notations` | cataloguer |
| GET | `/components` | public |
| GET | `/components/:id` | public |
| POST | `/components` | cataloguer |
| PATCH | `/components/:id` | cataloguer |
| DELETE | `/components/:id` | cataloguer |
| PUT | `/components/:id/keywords` | cataloguer |
| POST | `/components/:id/keywords` | cataloguer |
| DELETE | `/components/:id/keywords/:keywordId` | cataloguer |
| GET | `/keywords` | public |
| POST | `/search` | public |
| POST | `/components/:id/use` | login |
| GET | `/reports/summary` | cataloguer |
| GET | `/reports/purge-candidates` | cataloguer |
| POST | `/reports/purge` | cataloguer |
| GET | `/reports/audit` | cataloguer |
