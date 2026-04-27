# Requirements Document

## Introduction

Функция управления видимостью страниц позволяет администратору включать и отключать публичные страницы сайта (`/blog` и `/affiliate`) через раздел Site Settings в административной панели. При отключении страница возвращает HTTP 404 и скрывается из навигации (хедер и футер). Главная страница (`/`) всегда доступна и не может быть отключена. Настройки хранятся в существующей таблице `site_settings` (SQLite через Drizzle ORM) и применяются на сервере при каждом запросе.

## Glossary

- **Dashboard**: Административная панель по адресу `/dashboard`, защищённая JWT-авторизацией.
- **Site_Settings**: Единственная запись в таблице `site_settings` базы данных, хранящая глобальные настройки сайта.
- **Page_Visibility_Flag**: Булево поле в `site_settings` (`page_blog_enabled`, `page_affiliate_enabled`), определяющее доступность страницы.
- **Navigation**: Хедер и футер сайта, отображающие ссылки на разделы.
- **Settings_API**: Существующий REST-эндпоинт `PUT /api/site/settings`, обновляющий Site_Settings.
- **SiteSettingsEditor**: Клиентский React-компонент в дашборде, отвечающий за раздел Site Settings.
- **notFound()**: Функция Next.js App Router, возвращающая HTTP 404 и прекращающая рендеринг страницы.

---

## Requirements

### Requirement 1: Хранение флагов видимости страниц в БД

**User Story:** As an administrator, I want page visibility flags stored in the database, so that settings persist across server restarts and deployments.

#### Acceptance Criteria

1. THE Site_Settings SHALL contain a boolean field `page_blog_enabled` with a default value of `true`.
2. THE Site_Settings SHALL contain a boolean field `page_affiliate_enabled` with a default value of `true`.
3. WHEN the `site_settings` table does not contain the columns `page_blog_enabled` or `page_affiliate_enabled`, THE Database SHALL add these columns with default value `true` via an ALTER TABLE migration executed at application startup.
4. WHEN a new `site_settings` row is inserted (seed), THE Site_Settings SHALL set `page_blog_enabled = true` and `page_affiliate_enabled = true`.

---

### Requirement 2: API — чтение и обновление флагов видимости

**User Story:** As an administrator, I want to read and update page visibility flags via the existing settings API, so that the dashboard can persist changes without a new endpoint.

#### Acceptance Criteria

1. WHEN a `GET /api/site/settings` request is received, THE Settings_API SHALL include `page_blog_enabled` and `page_affiliate_enabled` in the response body.
2. WHEN a `PUT /api/site/settings` request contains `page_blog_enabled` (boolean), THE Settings_API SHALL update the `page_blog_enabled` field in Site_Settings.
3. WHEN a `PUT /api/site/settings` request contains `page_affiliate_enabled` (boolean), THE Settings_API SHALL update the `page_affiliate_enabled` field in Site_Settings.
4. WHEN a `PUT /api/site/settings` request does not contain `page_blog_enabled`, THE Settings_API SHALL preserve the existing value of `page_blog_enabled`.
5. WHEN a `PUT /api/site/settings` request does not contain `page_affiliate_enabled`, THE Settings_API SHALL preserve the existing value of `page_affiliate_enabled`.
6. WHEN a `PUT /api/site/settings` request is received without a valid JWT token, THE Settings_API SHALL return HTTP 401 Unauthorized.

---

### Requirement 3: Возврат 404 для отключённых страниц

**User Story:** As a site visitor, I want disabled pages to return 404, so that I cannot access content that the administrator has hidden.

#### Acceptance Criteria

1. WHEN `page_blog_enabled = false` and a request is made to `/blog`, THE Blog_Page SHALL call `notFound()` and return HTTP 404.
2. WHEN `page_blog_enabled = false` and a request is made to `/blog/[category]`, THE Blog_Category_Page SHALL call `notFound()` and return HTTP 404.
3. WHEN `page_blog_enabled = false` and a request is made to `/blog/[category]/[post]`, THE Blog_Post_Page SHALL call `notFound()` and return HTTP 404.
4. WHEN `page_affiliate_enabled = false` and a request is made to `/affiliate`, THE Affiliate_Page SHALL call `notFound()` and return HTTP 404.
5. WHEN `page_affiliate_enabled = false` and a request is made to `/affiliate/cases/[slug]`, THE Affiliate_Case_Page SHALL call `notFound()` and return HTTP 404.
6. WHEN `page_blog_enabled = true`, THE Blog_Page SHALL render normally and return HTTP 200.
7. WHEN `page_affiliate_enabled = true`, THE Affiliate_Page SHALL render normally and return HTTP 200.
8. THE Home_Page (`/`) SHALL always return HTTP 200 regardless of any visibility flag.

---

### Requirement 4: Скрытие ссылок из навигации

**User Story:** As a site visitor, I want navigation links to disabled pages to be hidden, so that I am not directed to unavailable content.

#### Acceptance Criteria

1. WHEN `page_blog_enabled = false`, THE Navigation SHALL not render a link to `/blog` in the header.
2. WHEN `page_blog_enabled = false`, THE Navigation SHALL not render a link to `/blog` in the footer.
3. WHEN `page_affiliate_enabled = false`, THE Navigation SHALL not render a link to `/affiliate` in the header.
4. WHEN `page_affiliate_enabled = false`, THE Navigation SHALL not render a link to `/affiliate` in the footer.
5. WHEN `page_blog_enabled = true`, THE Navigation SHALL render a link to `/blog` in the header and footer.
6. WHEN `page_affiliate_enabled = true`, THE Navigation SHALL render a link to `/affiliate` in the header and footer.
7. THE Navigation SHALL always render a link to the home page (`/`) regardless of any visibility flag.
8. WHEN visibility flags change, THE Navigation SHALL reflect the updated state on the next server-rendered request.

---

### Requirement 5: Управление видимостью в дашборде (Site Settings)

**User Story:** As an administrator, I want toggle controls for page visibility in the Site Settings section of the dashboard, so that I can enable or disable pages without editing the database directly.

#### Acceptance Criteria

1. THE SiteSettingsEditor SHALL display a toggle (Switch) labelled "Страница /blog" for controlling `page_blog_enabled`.
2. THE SiteSettingsEditor SHALL display a toggle (Switch) labelled "Страница /affiliate" for controlling `page_affiliate_enabled`.
3. WHEN the SiteSettingsEditor loads, THE SiteSettingsEditor SHALL fetch the current values of `page_blog_enabled` and `page_affiliate_enabled` from `GET /api/site/settings` and set the toggles accordingly.
4. WHEN the administrator clicks "Сохранить настройки", THE SiteSettingsEditor SHALL include `page_blog_enabled` and `page_affiliate_enabled` in the `PUT /api/site/settings` request body.
5. WHEN the save request succeeds, THE SiteSettingsEditor SHALL display a success toast notification.
6. WHEN the save request fails, THE SiteSettingsEditor SHALL display an error toast notification.
7. THE SiteSettingsEditor SHALL display a note that the home page (`/`) cannot be disabled.
8. THE SiteSettingsEditor SHALL place the page visibility toggles within the existing Site Settings section, without creating a new dashboard tab or page.

---

### Requirement 6: Передача флагов видимости в компоненты навигации

**User Story:** As a developer, I want page visibility flags passed to Header and Footer components at render time, so that navigation is consistent with the current settings without additional client-side fetches.

#### Acceptance Criteria

1. THE Blog_Layout SHALL read `page_blog_enabled` and `page_affiliate_enabled` from Site_Settings and pass them to the Header and Footer components.
2. THE Affiliate_Layout SHALL read `page_blog_enabled` and `page_affiliate_enabled` from Site_Settings and pass them to the Header and Footer components.
3. THE Root_Layout (app/layout.tsx) SHALL NOT be responsible for fetching page visibility flags (flags are handled per-layout or per-page).
4. WHEN `page_blog_enabled = false`, THE Header SHALL exclude the `blog` nav item from the rendered navigation list.
5. WHEN `page_affiliate_enabled = false`, THE Header SHALL exclude the `affiliate` nav item from the rendered navigation list.
6. WHEN `page_blog_enabled = false`, THE Footer SHALL exclude the `blog` nav item from the rendered navigation list.
7. WHEN `page_affiliate_enabled = false`, THE Footer SHALL exclude the `affiliate` nav item from the rendered navigation list.
