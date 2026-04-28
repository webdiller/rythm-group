# Implementation Plan: Maintenance Mode

## Overview

Implement a site-wide maintenance mode controlled by a `site_published` boolean flag in `site_settings`. When disabled, all public routes return HTTP 503 with a branded HTML page. The dashboard and API routes remain accessible at all times. The middleware reads the flag via a lightweight internal API route (Node.js runtime) since Edge Runtime cannot use `better-sqlite3` directly.

## Tasks

- [x] 1. Add `site_published` column to DB (migration + schema + seed)
  - [x] 1.1 Add idempotent migration in `lib/db/migrations.ts`
    - Add `if (!names.has("site_published"))` block following the existing pattern
    - `ALTER TABLE site_settings ADD COLUMN site_published INTEGER NOT NULL DEFAULT 1`
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.2 Write property test for migration idempotency
    - **Property 1: Migration idempotency**
    - Run `runMigrations` on a DB without the column, assert column exists; run again, assert no error
    - **Validates: Requirements 1.2**

  - [x] 1.3 Add `site_published` field to `tableSiteSettings` in `lib/db/schema.ts`
    - `site_published: integer("site_published", { mode: "boolean" }).default(true)`
    - Place after `page_affiliate_enabled` to match column order
    - _Requirements: 1.1, 1.3_

  - [x] 1.4 Add `site_published: true` to the seed insert in `lib/db/seed.ts`
    - Add to the `existingSettings` insert block alongside `page_blog_enabled` and `page_affiliate_enabled`
    - _Requirements: 1.4_

- [x] 2. Create internal site-status API route
  - [x] 2.1 Create `app/api/internal/site-status/route.ts`
    - Export `runtime = "nodejs"`
    - `GET` handler: query `tableSiteSettings` (limit 1) and `tableContacts` where `scope = 'landing'` (limit 1)
    - Return `NextResponse.json({ site_published: settings?.site_published ?? true, telegram_url: contact?.telegram_url ?? null })`
    - No authentication required (read-only, no sensitive data)
    - _Requirements: 2.5_

  - [ ]* 2.2 Write unit tests for the internal status route
    - Test returns `site_published: true` when no row in `site_settings`
    - Test returns correct `telegram_url` from `contacts` where `scope = 'landing'`
    - Test returns `telegram_url: null` when no matching contact row
    - _Requirements: 2.5_

- [x] 3. Implement `maintenanceHtml` template function and update middleware
  - [x] 3.1 Implement `maintenanceHtml(telegramUrl: string | null): string` pure function
    - Create as a named export in `middleware.ts` (or a co-located helper file importable by middleware)
    - Self-contained HTML: inline `<style>` using CSS variables (`var(--background)`, `var(--foreground)`, `var(--primary)`, `var(--muted-foreground)`) with hardcoded dark fallbacks
    - Logo: `<img src="/api/site/logo" width="32" height="32" style="border-radius:8px" />`
    - H1: "Сайт временно недоступен", P: "Site temporarily unavailable"
    - Telegram link rendered only when `telegramUrl` is a non-empty string
    - No external stylesheet links, no JavaScript
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 3.2 Write property test for `maintenanceHtml` conditional Telegram link
    - **Property 4: Maintenance HTML conditionally includes Telegram link**
    - Generate arbitrary strings for `telegramUrl` (including null/empty); assert HTML contains/omits link correctly
    - **Validates: Requirements 3.3**

  - [ ]* 3.3 Write unit tests for `maintenanceHtml`
    - Contains both bilingual text strings
    - Contains `<img src="/api/site/logo"`
    - Contains `var(--background)` (CSS variables used)
    - Contains no `<link rel="stylesheet"` tags
    - _Requirements: 3.2, 3.4, 3.7_

  - [x] 3.4 Update `middleware.ts` to intercept public routes and enforce maintenance mode
    - Update `config.matcher` to add `"/"`, `"/blog/:path*"`, `"/affiliate/:path*"` alongside existing `"/dashboard/:path*"`
    - For paths starting with `/dashboard` or `/api`: apply existing auth logic and pass through (no maintenance check)
    - For all other matched paths: `fetch('/api/internal/site-status')` using absolute URL from `request.nextUrl.origin`
    - If fetch fails or `site_published` is `true`: `return NextResponse.next()`
    - If `site_published` is `false`: return `new Response(maintenanceHtml(telegramUrl), { status: 503, headers: { 'Retry-After': '3600', 'Content-Type': 'text/html; charset=utf-8' } })`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [ ]* 3.5 Write property test for middleware blocking all public routes when unpublished
    - **Property 2: Middleware blocks all public routes when unpublished**
    - Generate random path suffixes for `/`, `/blog/`, `/affiliate/` patterns; with `site_published=false`, assert status 503 and `Retry-After: 3600`
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 3.6 Write property test for middleware passing all protected routes regardless of flag
    - **Property 3: Middleware passes all protected routes regardless of flag**
    - Generate random path suffixes for `/dashboard/` and `/api/`; with any `site_published` value, assert middleware does not return 503
    - **Validates: Requirements 2.2**

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update Settings API to support `site_published`
  - [x] 5.1 Add `site_published?: boolean | null` to `SiteSettingsPayload` type in `app/api/site/settings/route.ts`
    - _Requirements: 4.1_

  - [x] 5.2 Add preserve-if-absent logic for `site_published` in the PUT handler
    - Read `currentSitePublished = existing?.site_published ?? true`
    - In `updateValues`: `site_published: typeof body.site_published === "boolean" ? body.site_published : currentSitePublished`
    - Add `site_published` to the `insert` fallback values block with `?? true`
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 5.3 Write property test for Settings API round-trip
    - **Property 5: Settings API round-trip preserves site_published**
    - Generate random boolean values; PUT then GET, assert returned `data.site_published` matches
    - **Validates: Requirements 4.1, 4.2, 4.4**

  - [ ]* 5.4 Write property test for Settings API preserve-if-absent
    - **Property 6: Settings API preserve-if-absent for site_published**
    - PUT without `site_published` field, GET, assert stored value unchanged
    - **Validates: Requirements 4.3**

- [x] 6. Update SiteSettingsEditor to add the maintenance mode toggle
  - [x] 6.1 Add `sitePublished` state and wire it to load/save in `components/dashboard/SiteSettingsEditor.tsx`
    - Add `const [sitePublished, setSitePublished] = useState(true)`
    - Add `sitePublished` to the `initialSettings` type
    - In `loadSettings`: `const sitePublishedValue = data?.site_published ?? true`, call `setSitePublished(sitePublishedValue)`, include in `setInitialSettings`
    - In `handleSaveSettings` PUT body: add `site_published: sitePublished`
    - In `setInitialSettings` after save: add `sitePublished`
    - _Requirements: 5.4, 5.5_

  - [x] 6.2 Add Switch toggle for `site_published` in the "Видимость страниц" card
    - Place the new Switch alongside the existing `pageBlogEnabled` / `pageAffiliateEnabled` toggles
    - Label: "Сайт опубликован"
    - When OFF: show description text "Сайт в режиме обслуживания — публичные страницы недоступны"
    - `checked={sitePublished}` / `onCheckedChange={setSitePublished}`
    - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties defined in the design document
- `middleware.ts` already exists in the project root — update it, do not create a new file
