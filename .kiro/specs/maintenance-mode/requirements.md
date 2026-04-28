# Requirements Document

## Introduction

Добавить в административную панель возможность включать/выключать режим обслуживания (maintenance mode) для всего публичного сайта. Режим управляется булевым флагом `site_published` в таблице `site_settings`. Когда флаг равен `false`, все публичные маршруты возвращают HTTP 503 с кастомной страницей-заглушкой. Дашборд и API-маршруты остаются доступными при любом состоянии флага.

## Glossary

- **Middleware**: Next.js middleware (`middleware.ts`), выполняемый на Edge Runtime перед обработкой запроса.
- **Maintenance_Mode**: Состояние сайта, при котором публичные страницы недоступны для посетителей.
- **Site_Published_Flag**: Булев флаг `site_published` в таблице `site_settings` (SQLite). `true` — сайт опубликован, `false` — режим обслуживания.
- **Public_Routes**: Маршруты `/`, `/blog/*`, `/affiliate/*`, доступные анонимным посетителям.
- **Protected_Routes**: Маршруты `/dashboard/*` и `/api/*`, остающиеся доступными при любом состоянии флага.
- **Maintenance_Page**: Статическая HTML-страница с HTTP-статусом 503, отображаемая при включённом режиме обслуживания.
- **SiteSettingsEditor**: Существующий React-компонент дашборда (`components/dashboard/SiteSettingsEditor.tsx`), управляющий настройками сайта.
- **Settings_API**: Существующий API-эндпоинт `PUT /api/site/settings` с JWT-авторизацией.
- **Contacts_Table**: Таблица `contacts` в SQLite, содержащая поле `telegram_url` для scope `landing`.
- **DB_Path**: Путь к SQLite-базе данных, определяемый переменной окружения `DB_PATH`.

## Requirements

### Requirement 1: Флаг site_published в базе данных

**User Story:** As a site administrator, I want the maintenance mode state to be persisted in the database, so that it survives server restarts and is consistent across requests.

#### Acceptance Criteria

1. THE `site_settings` table SHALL contain a column `site_published` of type `INTEGER` (boolean mode) with a default value of `1` (true).
2. WHEN the `site_settings` table does not contain the `site_published` column, THE Migration_Runner SHALL add it via an idempotent `ALTER TABLE` statement.
3. THE Drizzle_Schema SHALL declare `site_published` as an integer column with `{ mode: "boolean" }` and `.default(true)` on the `tableSiteSettings` object.
4. WHEN no row exists in `site_settings`, THE System SHALL treat `site_published` as `true` (site is published).

---

### Requirement 2: Чтение флага в middleware

**User Story:** As a site visitor, I want to receive a proper 503 response when the site is under maintenance, so that my browser and search engines handle the downtime correctly.

#### Acceptance Criteria

1. WHEN a request targets a Public_Route (`/`, `/blog/*`, `/affiliate/*`) AND `site_published` is `false`, THE Middleware SHALL return an HTTP response with status code `503`.
2. WHEN a request targets a Protected_Route (`/dashboard/*`, `/api/*`), THE Middleware SHALL pass the request through regardless of the `site_published` flag value.
3. WHEN a request targets a Public_Route AND `site_published` is `true`, THE Middleware SHALL pass the request through without modification.
4. THE HTTP 503 response SHALL include the header `Retry-After: 3600`.
5. THE Middleware SHALL read the `site_published` flag by querying the SQLite database directly via `better-sqlite3` (synchronous API), without making an HTTP fetch to `/api/site/settings`.
6. IF the database file does not exist or the query fails, THEN THE Middleware SHALL treat `site_published` as `true` and pass the request through.
7. THE Middleware `config.matcher` SHALL include patterns for `/`, `/blog/:path*`, and `/affiliate/:path*` in addition to the existing `/dashboard/:path*` pattern.

---

### Requirement 3: Страница 503

**User Story:** As a site visitor, I want to see a clear and branded maintenance page when the site is unavailable, so that I understand the situation and know how to contact support.

#### Acceptance Criteria

1. THE Maintenance_Page SHALL display the site logo fetched from `/api/site/logo`.
2. THE Maintenance_Page SHALL display the text "Сайт временно недоступен" in Russian and "Site temporarily unavailable" in English, both visible simultaneously.
3. THE Maintenance_Page SHALL display a link to Telegram if `telegram_url` is set in the `contacts` table for `scope = 'landing'`; IF `telegram_url` is not set or the query fails, THEN THE Maintenance_Page SHALL not display the Telegram link.
4. THE Maintenance_Page SHALL support dark mode using the existing CSS variables defined in `app/globals.css` (e.g., `--background`, `--foreground`, `--primary`, `--muted-foreground`).
5. THE Maintenance_Page SHALL be minimal in design: logo, bilingual status text, and optional Telegram link only — no navigation, no footer, no other content.
6. THE Maintenance_Page SHALL be identical for all Public_Routes — it does not vary by the specific path requested.
7. THE Maintenance_Page HTML SHALL be self-contained (inline styles using CSS variables) so it renders correctly without loading external stylesheets.

---

### Requirement 4: Управление флагом через API

**User Story:** As a site administrator, I want to toggle maintenance mode via the existing settings API, so that the dashboard can control it without a new endpoint.

#### Acceptance Criteria

1. THE Settings_API (`PUT /api/site/settings`) SHALL accept a `site_published` boolean field in the request body.
2. WHEN `site_published` is provided in the request body, THE Settings_API SHALL persist the value to the `site_settings` table.
3. WHEN `site_published` is not provided in the request body, THE Settings_API SHALL preserve the existing value from the database.
4. THE Settings_API GET response SHALL include the `site_published` field in the returned `data` object.
5. THE Settings_API SHALL require JWT authentication for `PUT` requests; IF the token is missing or invalid, THEN THE Settings_API SHALL return HTTP 401.

---

### Requirement 5: Тоггл в дашборде

**User Story:** As a site administrator, I want a toggle switch in the Site Settings section of the dashboard, so that I can enable or disable maintenance mode with a single click.

#### Acceptance Criteria

1. THE SiteSettingsEditor SHALL display a Switch toggle labelled "Сайт опубликован" for the `site_published` flag.
2. WHEN the toggle is in the ON position, THE SiteSettingsEditor SHALL indicate that the site is published (maintenance mode is off).
3. WHEN the toggle is in the OFF position, THE SiteSettingsEditor SHALL indicate that the site is in maintenance mode.
4. WHEN the administrator saves settings, THE SiteSettingsEditor SHALL include `site_published` in the `PUT /api/site/settings` request body.
5. WHEN settings are loaded from the API, THE SiteSettingsEditor SHALL initialise the toggle state from the `site_published` field; IF the field is absent, THE SiteSettingsEditor SHALL default to `true` (published).
6. THE Switch toggle for `site_published` SHALL be visually grouped with the existing page-visibility toggles (`page_blog_enabled`, `page_affiliate_enabled`) in the SiteSettingsEditor.
