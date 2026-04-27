# Design Document: Page Visibility Control

## Overview

This feature adds administrator-controlled visibility flags for the `/blog` and `/affiliate` public pages. Flags are stored as two boolean columns (`page_blog_enabled`, `page_affiliate_enabled`) in the existing `site_settings` SQLite table. When a flag is `false`, every server component under that route calls `notFound()`, returning HTTP 404. Navigation components (Header and Footer) receive the flags as props from their parent layout server components and filter out disabled nav items. The dashboard `SiteSettingsEditor` gains two Switch toggles that read and write the flags via the existing `PUT /api/site/settings` endpoint. The home page (`/`) is always accessible and is not affected by any flag.

## Architecture

```mermaid
flowchart TD
    Admin["Admin (Dashboard)"] -->|PUT /api/site/settings| API["API Route\n/api/site/settings"]
    API -->|UPDATE site_settings| DB[(SQLite\nsite_settings)]

    DB -->|getDb() on request| BlogLayout["app/blog/layout.tsx\n(Server Component)"]
    DB -->|getDb() on request| AffLayout["app/affiliate/layout.tsx\n(Server Component)"]

    BlogLayout -->|page_blog_enabled=false| notFound1["notFound() → 404"]
    BlogLayout -->|pageBlogEnabled, pageAffiliateEnabled props| Header1["Header"]
    BlogLayout -->|pageBlogEnabled, pageAffiliateEnabled props| Footer1["Footer"]

    AffLayout -->|page_affiliate_enabled=false| notFound2["notFound() → 404"]
    AffLayout -->|pageBlogEnabled, pageAffiliateEnabled props| Header2["Header"]
    AffLayout -->|pageBlogEnabled, pageAffiliateEnabled props| Footer2["Footer"]

    BlogPages["app/blog/page.tsx\napp/blog/[category]/page.tsx\napp/blog/[category]/[post]/page.tsx"] -->|page_blog_enabled=false| notFound3["notFound() → 404"]
    AffPages["app/affiliate/page.tsx\napp/affiliate/cases/[slug]/page.tsx"] -->|page_affiliate_enabled=false| notFound4["notFound() → 404"]
```

The design follows the existing pattern in the codebase: server components fetch settings directly via `getDb()` (synchronous better-sqlite3 calls), and client components fetch via the HTTP API. No new API endpoints are introduced.

## Components and Interfaces

### 1. Database Migration Utility (`lib/db/migrations.ts`)

A new module that runs `ALTER TABLE` statements idempotently at application startup. It is called from `lib/db/index.ts` inside `getDb()` before returning the db instance (first call only).

```typescript
// lib/db/migrations.ts
import type Database from "better-sqlite3"

export function runMigrations(sqlite: Database.Database): void {
  // Each migration is guarded by a column-existence check
  const columns = sqlite
    .prepare("PRAGMA table_info(site_settings)")
    .all() as Array<{ name: string }>
  const names = new Set(columns.map((c) => c.name))

  if (!names.has("page_blog_enabled")) {
    sqlite.exec(
      "ALTER TABLE site_settings ADD COLUMN page_blog_enabled INTEGER NOT NULL DEFAULT 1"
    )
  }
  if (!names.has("page_affiliate_enabled")) {
    sqlite.exec(
      "ALTER TABLE site_settings ADD COLUMN page_affiliate_enabled INTEGER NOT NULL DEFAULT 1"
    )
  }
}
```

`getDb()` calls `runMigrations(sqlite)` once, right after `sqlite.pragma("foreign_keys = ON")`.

### 2. Schema Update (`lib/db/schema.ts`)

Two fields added to `tableSiteSettings`:

```typescript
page_blog_enabled: integer("page_blog_enabled", { mode: "boolean" }).default(true),
page_affiliate_enabled: integer("page_affiliate_enabled", { mode: "boolean" }).default(true),
```

### 3. Seed Update (`lib/db/seed.ts`)

The existing `site_settings` seed block gains the two new fields with `true` defaults:

```typescript
page_blog_enabled: true,
page_affiliate_enabled: true,
```

### 4. API Route (`app/api/site/settings/route.ts`)

`SiteSettingsPayload` gains two optional boolean fields:

```typescript
page_blog_enabled?: boolean | null
page_affiliate_enabled?: boolean | null
```

GET response already returns the full row — no change needed beyond the schema update.

PUT handler reads current values and applies the same preserve-if-absent pattern used for all other boolean fields:

```typescript
const currentPageBlogEnabled = existing?.page_blog_enabled ?? true
const currentPageAffiliateEnabled = existing?.page_affiliate_enabled ?? true

// in updateValues:
page_blog_enabled:
  typeof body.page_blog_enabled === "boolean"
    ? body.page_blog_enabled
    : currentPageBlogEnabled,
page_affiliate_enabled:
  typeof body.page_affiliate_enabled === "boolean"
    ? body.page_affiliate_enabled
    : currentPageAffiliateEnabled,
```

Both fields are also included in the `INSERT` fallback path with `true` defaults.

### 5. Page-Level 404 Enforcement

A shared helper reads the flags directly from the DB (server-only):

```typescript
// lib/db/page-visibility.ts
import "server-only"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"

export function getPageVisibilityFlags(): {
  pageBlogEnabled: boolean
  pageAffiliateEnabled: boolean
} {
  const db = getDb()
  const row = db.select({
    page_blog_enabled: tableSiteSettings.page_blog_enabled,
    page_affiliate_enabled: tableSiteSettings.page_affiliate_enabled,
  }).from(tableSiteSettings).limit(1).get()

  return {
    pageBlogEnabled: row?.page_blog_enabled ?? true,
    pageAffiliateEnabled: row?.page_affiliate_enabled ?? true,
  }
}
```

Each affected server component calls this helper and conditionally calls `notFound()`:

- `app/blog/layout.tsx` — calls `notFound()` if `!pageBlogEnabled`
- `app/blog/page.tsx` — calls `notFound()` if `!pageBlogEnabled`
- `app/blog/[category]/page.tsx` — calls `notFound()` if `!pageBlogEnabled`
- `app/blog/[category]/[post]/page.tsx` — calls `notFound()` if `!pageBlogEnabled`
- `app/affiliate/layout.tsx` — calls `notFound()` if `!pageAffiliateEnabled`
- `app/affiliate/page.tsx` — calls `notFound()` if `!pageAffiliateEnabled`
- `app/affiliate/cases/[slug]/page.tsx` — calls `notFound()` if `!pageAffiliateEnabled`

The layout-level check is the primary guard (it short-circuits all child routes). The page-level checks are defense-in-depth for cases where a page component might be rendered outside its layout (e.g., during static generation or direct import in tests).

### 6. Navigation Components

**Header (`components/header.tsx`)**

Two new optional props are added:

```typescript
type HeaderProps = {
  sectionHrefPrefix?: "" | "/"
  navOrder?: HeaderNavItemId[]
  logoText?: string | null
  pageBlogEnabled?: boolean    // new
  pageAffiliateEnabled?: boolean  // new
}
```

The `navItems` array is filtered before rendering:

```typescript
const navItems = resolvedNavOrder
  .filter((id) => {
    if (id === "blog" && pageBlogEnabled === false) return false
    if (id === "affiliate" && pageAffiliateEnabled === false) return false
    return true
  })
  .map((id) => navById[id])
```

Default values for both props are `true` (undefined = enabled), preserving backward compatibility with all existing call sites (home page layout, etc.) that do not pass these props.

**Footer (`components/footer.tsx`)**

Same pattern — two new optional props added to `FooterProps` and `SiteSettings` type, same filter applied to `navItems`. The `SiteSettings` type exported from footer gains:

```typescript
page_blog_enabled?: boolean | null
page_affiliate_enabled?: boolean | null
```

The footer reads these from `siteSettings` and passes them to the filter.

### 7. Layout Updates

**`app/blog/layout.tsx`** and **`app/affiliate/layout.tsx`** are updated to:

1. Call `getPageVisibilityFlags()` (direct DB read, no extra HTTP fetch — the settings fetch already happens for `siteSettings`).
2. Call `notFound()` if the relevant flag is false.
3. Pass `pageBlogEnabled` and `pageAffiliateEnabled` to both `<Header>` and `<Footer>`.

Since both layouts already fetch `siteSettings` via HTTP for the `SiteSettings` type used by Footer, the visibility flags can be extracted from that same response to avoid a second DB call. The `SiteSettings` type in `footer.tsx` is extended to include the new fields, and the layout extracts them from `settingsJson.data`.

### 8. Dashboard UI (`components/dashboard/SiteSettingsEditor.tsx`)

Two new state variables:

```typescript
const [pageBlogEnabled, setPageBlogEnabled] = useState(true)
const [pageAffiliateEnabled, setPageAffiliateEnabled] = useState(true)
```

Added to `initialSettings` type and populated in `loadSettings`:

```typescript
pageBlogEnabled: data?.page_blog_enabled ?? true,
pageAffiliateEnabled: data?.page_affiliate_enabled ?? true,
```

Included in `handleSaveSettings` PUT body:

```typescript
page_blog_enabled: pageBlogEnabled,
page_affiliate_enabled: pageAffiliateEnabled,
```

A new Card section "Видимость страниц" is added (placed before the save button area, within the existing settings section):

```tsx
<Card>
  <CardHeader>
    <CardTitle>Видимость страниц</CardTitle>
    <CardDescription>
      Главная страница (/) всегда доступна и не может быть отключена.
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor="page_blog_enabled">Страница /blog</Label>
        <p className="text-xs text-muted-foreground">
          При отключении страница вернёт 404 и исчезнет из навигации.
        </p>
      </div>
      <Switch
        id="page_blog_enabled"
        checked={pageBlogEnabled}
        onCheckedChange={setPageBlogEnabled}
      />
    </div>
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <Label htmlFor="page_affiliate_enabled">Страница /affiliate</Label>
        <p className="text-xs text-muted-foreground">
          При отключении страница вернёт 404 и исчезнет из навигации.
        </p>
      </div>
      <Switch
        id="page_affiliate_enabled"
        checked={pageAffiliateEnabled}
        onCheckedChange={setPageAffiliateEnabled}
      />
    </div>
  </CardContent>
</Card>
```

## Data Models

### `site_settings` table (additions)

| Column | Type | SQLite type | Default | Nullable |
|---|---|---|---|---|
| `page_blog_enabled` | boolean | `INTEGER` | `1` (true) | NOT NULL |
| `page_affiliate_enabled` | boolean | `INTEGER` | `1` (true) | NOT NULL |

Migration: `ALTER TABLE site_settings ADD COLUMN page_blog_enabled INTEGER NOT NULL DEFAULT 1` (and same for `page_affiliate_enabled`). Guarded by `PRAGMA table_info` check so it is idempotent.

### API payload additions

`PUT /api/site/settings` body (new optional fields):

```typescript
{
  page_blog_enabled?: boolean | null   // omit = preserve existing
  page_affiliate_enabled?: boolean | null
}
```

`GET /api/site/settings` response `data` object gains the same two fields from the DB row.

### Component prop additions

**Header props:**
```typescript
pageBlogEnabled?: boolean      // default: true (undefined = enabled)
pageAffiliateEnabled?: boolean // default: true
```

**Footer `SiteSettings` type:**
```typescript
page_blog_enabled?: boolean | null
page_affiliate_enabled?: boolean | null
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API round-trip preserves flag values

*For any* boolean value of `page_blog_enabled` or `page_affiliate_enabled`, sending that value via `PUT /api/site/settings` and then reading it back via `GET /api/site/settings` should return the same value that was written.

**Validates: Requirements 2.2, 2.3**

### Property 2: Omitted flags are preserved

*For any* existing boolean value of `page_blog_enabled` (or `page_affiliate_enabled`), sending a `PUT /api/site/settings` request that omits that field should leave the stored value unchanged.

**Validates: Requirements 2.4, 2.5**

### Property 3: Disabled blog routes always return 404

*For any* category slug and post slug, when `page_blog_enabled = false`, requests to `/blog/[category]` and `/blog/[category]/[post]` should result in `notFound()` being called (HTTP 404).

**Validates: Requirements 3.2, 3.3**

### Property 4: Disabled affiliate case routes always return 404

*For any* case slug, when `page_affiliate_enabled = false`, a request to `/affiliate/cases/[slug]` should result in `notFound()` being called (HTTP 404).

**Validates: Requirements 3.5**

### Property 5: Disabled page nav items are excluded from Header

*For any* nav order configuration, when `pageBlogEnabled = false`, the rendered Header should contain no link whose `href` includes `/blog`; when `pageAffiliateEnabled = false`, no link whose `href` includes `/affiliate`.

**Validates: Requirements 4.1, 4.3, 6.4, 6.5**

### Property 6: Disabled page nav items are excluded from Footer

*For any* nav order configuration, when `page_blog_enabled = false` in `siteSettings`, the rendered Footer should contain no link to `/blog`; when `page_affiliate_enabled = false`, no link to `/affiliate`.

**Validates: Requirements 4.2, 4.4, 6.6, 6.7**

### Property 7: Home page link is always present in navigation

*For any* combination of `pageBlogEnabled` and `pageAffiliateEnabled` values, the Header and Footer should always render a link to the home page (`/`).

**Validates: Requirements 4.7**

### Property 8: SiteSettingsEditor toggle state round-trip

*For any* combination of `page_blog_enabled` and `page_affiliate_enabled` values returned by the API, after the SiteSettingsEditor loads, the toggle states should match the API values; and after clicking save, the PUT request body should contain those same values.

**Validates: Requirements 5.3, 5.4**

## Error Handling

| Scenario | Behavior |
|---|---|
| `site_settings` row does not exist | `getPageVisibilityFlags()` returns `{ pageBlogEnabled: true, pageAffiliateEnabled: true }` — pages are enabled by default |
| `page_blog_enabled` column missing (pre-migration) | Migration runs at startup before any request is served; column will exist by the time any request arrives |
| `PUT /api/site/settings` without auth token | Returns HTTP 401 (existing `requireAuth` middleware, unchanged) |
| `PUT /api/site/settings` with non-boolean value for flags | Field is ignored (treated as absent), existing value is preserved |
| `notFound()` called in layout | Next.js renders the nearest `not-found.tsx` boundary and returns HTTP 404 |
| Settings API unavailable during layout fetch | Layout falls back to `siteSettings = null`; `page_blog_enabled` and `page_affiliate_enabled` default to `true` (pages remain accessible) |

## Testing Strategy

This feature involves server components, a REST API, a client-side form component, and navigation rendering. The appropriate mix is:

**Unit tests (example-based):**
- `getPageVisibilityFlags()` returns `true` defaults when no row exists
- `getPageVisibilityFlags()` returns correct values from a seeded row
- `GET /api/site/settings` response includes `page_blog_enabled` and `page_affiliate_enabled`
- `PUT /api/site/settings` without auth returns 401
- Blog layout calls `notFound()` when `page_blog_enabled = false`
- Affiliate layout calls `notFound()` when `page_affiliate_enabled = false`
- SiteSettingsEditor renders toggles labelled "Страница /blog" and "Страница /affiliate"
- SiteSettingsEditor renders note about home page always being accessible
- Save success shows toast.success; save failure shows toast.error

**Property-based tests** (using [fast-check](https://github.com/dubzzz/fast-check), minimum 100 iterations each):

Each property test is tagged with a comment referencing the design property it validates.
Tag format: `// Feature: page-visibility-control, Property N: <property_text>`

- **Property 1** — `fc.boolean()` for each flag: PUT → GET round-trip preserves value
- **Property 2** — `fc.boolean()` for existing value: PUT without field → value unchanged
- **Property 3** — `fc.string()` for category/post slugs: when blog disabled, page components call `notFound()`
- **Property 4** — `fc.string()` for case slug: when affiliate disabled, case page calls `notFound()`
- **Property 5** — `fc.shuffledSubarray(ALL_NAV_IDS)` for nav order: Header filters correctly for any order
- **Property 6** — `fc.shuffledSubarray(ALL_NAV_IDS)` for nav order: Footer filters correctly for any order
- **Property 7** — `fc.boolean() × fc.boolean()` for flag combinations: home link always present
- **Property 8** — `fc.boolean() × fc.boolean()` for flag combinations: SiteSettingsEditor toggle/save round-trip

**Integration tests (smoke):**
- Migration runs idempotently: columns exist after `runMigrations()` on a fresh DB and on a DB that already has them
- Seed inserts `page_blog_enabled = true` and `page_affiliate_enabled = true` on a fresh DB
