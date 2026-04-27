# Implementation Plan: Page Visibility Control

## Overview

Add `page_blog_enabled` and `page_affiliate_enabled` boolean flags to `site_settings`. When a flag is `false`, all server components under that route call `notFound()` and the nav links are hidden from Header and Footer. The dashboard `SiteSettingsEditor` gains two Switch toggles to control the flags.

## Tasks

- [x] 1. Add DB migration utility and run it at startup
  - Create `lib/db/migrations.ts` with `runMigrations(sqlite)` that uses `PRAGMA table_info(site_settings)` to idempotently `ALTER TABLE` and add `page_blog_enabled INTEGER NOT NULL DEFAULT 1` and `page_affiliate_enabled INTEGER NOT NULL DEFAULT 1`
  - Call `runMigrations(sqlite)` inside `getDb()` in `lib/db/index.ts`, right after `sqlite.pragma("foreign_keys = ON")`, before `drizzle(...)` is called — pass the raw `sqlite` instance, not the drizzle wrapper
  - _Requirements: 1.3_

- [x] 2. Update schema and seed
  - [x] 2.1 Add the two new fields to `tableSiteSettings` in `lib/db/schema.ts`
    - `page_blog_enabled: integer("page_blog_enabled", { mode: "boolean" }).default(true)`
    - `page_affiliate_enabled: integer("page_affiliate_enabled", { mode: "boolean" }).default(true)`
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Add `page_blog_enabled: true` and `page_affiliate_enabled: true` to the `tableSiteSettings` `.values({...})` block in `lib/db/seed.ts`
    - _Requirements: 1.4_

- [x] 3. Update the settings API route
  - [x] 3.1 Add `page_blog_enabled?: boolean | null` and `page_affiliate_enabled?: boolean | null` to `SiteSettingsPayload` in `app/api/site/settings/route.ts`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 In the PUT handler, read current values (`existing?.page_blog_enabled ?? true`, `existing?.page_affiliate_enabled ?? true`) and apply the preserve-if-absent pattern (same as `blog_show_dates` etc.) in `updateValues`
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Add both fields to the INSERT fallback `.values({...})` block with `true` defaults
    - _Requirements: 2.2, 2.3_

  - [ ]* 3.4 Write property test for API round-trip (Property 1)
    - **Property 1: API round-trip preserves flag values**
    - Use `fc.boolean()` for each flag: PUT a value → GET → assert returned value equals written value
    - Tag: `// Feature: page-visibility-control, Property 1: API round-trip preserves flag values`
    - **Validates: Requirements 2.2, 2.3**

  - [ ]* 3.5 Write property test for omitted flags preservation (Property 2)
    - **Property 2: Omitted flags are preserved**
    - Use `fc.boolean()` for existing value: PUT without the field → GET → assert value unchanged
    - Tag: `// Feature: page-visibility-control, Property 2: Omitted flags are preserved`
    - **Validates: Requirements 2.4, 2.5**

- [x] 4. Create the page-visibility helper
  - Create `lib/db/page-visibility.ts` with `"server-only"` import and `getPageVisibilityFlags()` function
  - The function calls `getDb()`, queries `tableSiteSettings` for `page_blog_enabled` and `page_affiliate_enabled`, and returns `{ pageBlogEnabled: boolean, pageAffiliateEnabled: boolean }` defaulting both to `true` when no row exists
  - _Requirements: 3.1, 3.4_

- [x] 5. Enforce 404 in blog server components
  - [x] 5.1 Update `app/blog/layout.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageBlogEnabled`; also extract `pageBlogEnabled` and `pageAffiliateEnabled` from the already-fetched `settingsJson.data` and pass them as props to `<Header>` and `<Footer>`
    - _Requirements: 3.1, 6.1, 6.4, 6.6_

  - [x] 5.2 Update `app/blog/page.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageBlogEnabled`
    - _Requirements: 3.1_

  - [x] 5.3 Update `app/blog/[category]/page.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageBlogEnabled`
    - _Requirements: 3.2_

  - [x] 5.4 Update `app/blog/[category]/[post]/page.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageBlogEnabled`
    - _Requirements: 3.3_

  - [ ]* 5.5 Write property test for disabled blog routes (Property 3)
    - **Property 3: Disabled blog routes always return 404**
    - Use `fc.string()` for category/post slugs: when `page_blog_enabled = false`, assert `notFound()` is called in the page components
    - Tag: `// Feature: page-visibility-control, Property 3: Disabled blog routes always return 404`
    - **Validates: Requirements 3.2, 3.3**

- [x] 6. Enforce 404 in affiliate server components
  - [x] 6.1 Update `app/affiliate/layout.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageAffiliateEnabled`; extract and pass `pageBlogEnabled` and `pageAffiliateEnabled` to `<Header>` and `<Footer>`
    - _Requirements: 3.4, 6.2, 6.5, 6.7_

  - [x] 6.2 Update `app/affiliate/page.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageAffiliateEnabled`
    - _Requirements: 3.4_

  - [x] 6.3 Update `app/affiliate/cases/[slug]/page.tsx` to call `getPageVisibilityFlags()` and call `notFound()` if `!pageAffiliateEnabled`
    - _Requirements: 3.5_

  - [ ]* 6.4 Write property test for disabled affiliate case routes (Property 4)
    - **Property 4: Disabled affiliate case routes always return 404**
    - Use `fc.string()` for case slug: when `page_affiliate_enabled = false`, assert `notFound()` is called
    - Tag: `// Feature: page-visibility-control, Property 4: Disabled affiliate case routes always return 404`
    - **Validates: Requirements 3.5**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Update Header component to filter nav items
  - Add `pageBlogEnabled?: boolean` and `pageAffiliateEnabled?: boolean` to `HeaderProps` in `components/header.tsx`
  - Filter `navItems` before rendering: exclude `blog` when `pageBlogEnabled === false`, exclude `affiliate` when `pageAffiliateEnabled === false`; default both to `true` so existing call sites are unaffected
  - _Requirements: 4.1, 4.3, 6.4, 6.5_

  - [ ]* 8.1 Write property test for Header nav filtering (Property 5)
    - **Property 5: Disabled page nav items are excluded from Header**
    - Use `fc.shuffledSubarray(ALL_NAV_IDS)` for nav order: assert no `/blog` link when `pageBlogEnabled=false`, no `/affiliate` link when `pageAffiliateEnabled=false`
    - Tag: `// Feature: page-visibility-control, Property 5: Disabled page nav items are excluded from Header`
    - **Validates: Requirements 4.1, 4.3, 6.4, 6.5**

  - [ ]* 8.2 Write property test for home link always present in Header (Property 7)
    - **Property 7: Home page link is always present in navigation**
    - Use `fc.boolean() × fc.boolean()` for flag combinations: assert home link always rendered
    - Tag: `// Feature: page-visibility-control, Property 7: Home page link is always present in navigation`
    - **Validates: Requirements 4.7**

- [x] 9. Update Footer component and SiteSettings type to filter nav items
  - Add `page_blog_enabled?: boolean | null` and `page_affiliate_enabled?: boolean | null` to the `SiteSettings` type exported from `components/footer.tsx`
  - Filter `navItems` in Footer using the same pattern as Header, reading from `siteSettings.page_blog_enabled` and `siteSettings.page_affiliate_enabled`
  - _Requirements: 4.2, 4.4, 6.6, 6.7_

  - [ ]* 9.1 Write property test for Footer nav filtering (Property 6)
    - **Property 6: Disabled page nav items are excluded from Footer**
    - Use `fc.shuffledSubarray(ALL_NAV_IDS)` for nav order: assert no `/blog` link when `page_blog_enabled=false`, no `/affiliate` link when `page_affiliate_enabled=false`
    - Tag: `// Feature: page-visibility-control, Property 6: Disabled page nav items are excluded from Footer`
    - **Validates: Requirements 4.2, 4.4, 6.6, 6.7**

- [x] 10. Update SiteSettingsEditor dashboard component
  - [x] 10.1 Add `pageBlogEnabled` and `pageAffiliateEnabled` state variables (both default `true`) to `SiteSettingsEditor` in `components/dashboard/SiteSettingsEditor.tsx`
    - Extend the `initialSettings` type and populate both fields in `loadSettings` from `data?.page_blog_enabled ?? true` and `data?.page_affiliate_enabled ?? true`
    - Include both fields in the `handleSaveSettings` PUT body
    - _Requirements: 5.3, 5.4_

  - [x] 10.2 Add the "Видимость страниц" Card section to the JSX, placed before the save button area
    - Two `Switch` rows: one labelled "Страница /blog" (`id="page_blog_enabled"`), one labelled "Страница /affiliate" (`id="page_affiliate_enabled"`)
    - Include a `CardDescription` noting that the home page (`/`) cannot be disabled
    - _Requirements: 5.1, 5.2, 5.7, 5.8_

  - [ ]* 10.3 Write property test for SiteSettingsEditor toggle/save round-trip (Property 8)
    - **Property 8: SiteSettingsEditor toggle state round-trip**
    - Use `fc.boolean() × fc.boolean()` for flag combinations: after load, toggle states match API values; after save, PUT body contains those values
    - Tag: `// Feature: page-visibility-control, Property 8: SiteSettingsEditor toggle state round-trip`
    - **Validates: Requirements 5.3, 5.4**

  - [ ]* 10.4 Write unit tests for SiteSettingsEditor
    - Assert toggles labelled "Страница /blog" and "Страница /affiliate" are rendered
    - Assert note about home page always being accessible is rendered
    - Assert `toast.success` on save success and `toast.error` on save failure
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_

- [ ] 11. Write integration smoke tests for migration
  - Test that `runMigrations()` is idempotent: columns exist after running on a fresh DB and on a DB that already has them
  - Test that seed inserts `page_blog_enabled = true` and `page_affiliate_enabled = true` on a fresh DB
  - _Requirements: 1.3, 1.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with minimum 100 iterations each
- The migration in task 1 must run before `drizzle()` wraps the sqlite instance, since drizzle doesn't expose raw `exec`
- Layouts already fetch `siteSettings` via HTTP; extract visibility flags from that same response to avoid a second DB call
- The root layout (`app/layout.tsx`) must NOT be modified — flags are handled per-layout only (Requirement 6.3)
