# План: рефактор медиа и перенос на Yandex Object Storage (S3)

Документ описывает поэтапный перенос **всех** пользовательских медиа проекта на S3-совместимое хранилище Yandex Object Storage и унификацию работы с URL.

Статус на момент написания: **логотипы партнёров** уже пишутся в S3 (ключ в `partners.logo_url`), отдача на фронте пока через `/api/content/partners/[id]/logo` (302 / legacy base64).

---

## 1. Цели

1. Убрать base64-blob’ы из SQLite.
2. Убрать крупные медиа с диска VPS (`public/uploads`, `public/backgrounds`), кроме статики репозитория.
3. Единый слой `lib/s3/*` для upload / delete / public URL.
4. В БД хранить **только S3-ключ**; в UI — **публичный URL**, собранный хелпером (не хардкод полного URL в админке).
5. Идемпотентные скрипты миграции для локалки и VPS.
6. После миграции — упростить/удалить API-прокси отдачи байтов из БД.

---

## 2. Целевая архитектура

### 2.1. Конфиг (уже есть + дополнение)

Обязательные (сервер):

- `YA_STORAGE_ID`
- `YA_STORAGE_SECRET`
- `YA_BUCKET_NAME`
- `YA_REGION`
- `YA_ENDPOINT`

Для клиента (рекомендуется добавить):

- `NEXT_PUBLIC_YA_PUBLIC_BASE` — публичный префикс без завершающего `/`,  
  пример: `https://storage.yandexcloud.net/rythm-group`  
  (= `{YA_ENDPOINT}/{YA_BUCKET_NAME}`).

Так `src` в браузере строится без self-fetch и без прокси Next. Секреты (`ID`/`SECRET`) в клиент **не** попадают.

Альтернатива без новой env: прокидывать `publicUrl` уже собранным с сервера в props/API. Для CMS и списков с ключом в JSON удобнее `NEXT_PUBLIC_YA_PUBLIC_BASE`.

### 2.2. Соглашения по ключам

| Тип | Префикс ключа | Пример |
|---|---|---|
| Логотип партнёра | `partners/{id}/` | `partners/12/logo-{uuid}.webp` |
| Аватар канала | `channels/{id}/` | `channels/3/avatar-{uuid}.webp` |
| Иконка about-card | `about-cards/{id}/` | `about-cards/1/icon-{uuid}.webp` |
| Логотип сайта | `site/` | `site/logo-{uuid}.webp` |
| Favicon | `site/` | `site/favicon-{uuid}.webp` |
| Фон hero | `site/backgrounds/hero/` | `site/backgrounds/hero/light-{uuid}.webp` |
| Фон global | `site/backgrounds/global/` | `site/backgrounds/global/affiliate-dark-{uuid}.webp` |
| Обложка блога | `blog/images/` | `blog/images/{ts}-{uuid}.webp` |
| Видео блога | `blog/videos/` | `blog/videos/{ts}-{uuid}.mp4` |

Правила:

- При **замене** — upload нового ключа → запись в БД → delete старого ключа.
- При **удалении** сущности — delete объекта в S3.
- `ACL: public-read` + `Cache-Control: public, max-age=31536000, immutable` (ключ с UUID).
- В колонках БД — **только key** (не `https://...`), кроме контента TipTap/HTML блога, где в разметке уже лежат публичные URL (см. этап блога).

### 2.3. Слой кода (рефактор `lib/s3`)

Текущее:

- `lib/s3/env.ts`, `client.ts`, `objects.ts`, `public-url.ts`, `partner-logo.ts`
- Частично устаревший `lib/s3-blog-upload.ts`

Целевое:

```
lib/s3/
  env.ts              # zod YA_*
  client.ts           # singleton S3Client
  objects.ts          # putPublicObject / deleteObjectByKey
  public-url.ts       # getPublicObjectUrl(key) — server
  public-url.shared.ts # getPublicObjectUrlFromBase(base, key) — client+server
  keys.ts             # префиксы, isS3Key(prefix), isLegacyBase64
  partner-logo.ts     # (оставить / обобщить)
  channel-avatar.ts
  about-icon.ts
  site-assets.ts      # logo, favicon, backgrounds
  blog-assets.ts
```

Общий паттерн модуля сущности:

- `build…Key(id)` / `upload…(id, buffer, contentType)`
- `deleteIfStored(value)`
- `resolvePublicUrl(value)`
- `isS3Key` / `isLegacyBase64`

### 2.4. Отдача в UI (решение)

**Лучший вариант для этого проекта:**

1. В БД — key.
2. В `img src` / `background-image` — полный публичный URL через хелпер.
3. API-роуты вида `/api/content/.../logo|avatar|icon` и `/api/site/logo|favicon` после миграции:
   - либо **удалить**,
   - либо оставить тонкий **302 redirect** на 1–2 релиза для закладок/кеша, затем удалить.

Фоны сейчас читаются с диска через API — после переноса либо прямой URL из settings (ключ → public URL), либо один redirect-роут на переходный период.

---

## 3. Инвентаризация «как есть»

| Медиа | Хранение сейчас | Отдача | Приоритет |
|---|---|---|---|
| Partner logo | S3 key (+ legacy base64) | `/api/content/partners/[id]/logo` | P0 — дочистить URL + миграция остатков |
| Channel avatar | base64 SQLite | `/api/content/channels/[id]/avatar` | P1 |
| About card icon | base64 SQLite | `/api/content/about-cards/[id]/icon` | P1 |
| Site logo / favicon | base64 SQLite (`site_settings`) | `/api/site/logo`, `/api/site/favicon` | P2 |
| Hero / global backgrounds | файлы `public/backgrounds/*.webp` | `/api/site/backgrounds/*` | P2 |
| Blog images / video | `public/uploads/blog/**` | `/uploads/blog/...` | P3 |
| TipTap inline images | зависят от upload блога | URL в HTML | P3 (вместе с блогом) |

---

## 4. Этапы работ

### Этап 0 — Подготовка (без смены UX)

1. Бакет: публичное чтение объектов (или object ACL `public-read`).
2. Добавить `NEXT_PUBLIC_YA_PUBLIC_BASE` в `.env.example` / `env.d.ts` / VPS.
3. Вынести shared `getPublicObjectUrl` для client/server.
4. Унифицировать `isLegacyBase64` / `isS3Key(prefix)` в `lib/s3/keys.ts`.
5. Чеклист: локально upload партнёра → объект в консоли Yandex → public URL открывается в браузере.

**Критерий готовности:** env на всех окружениях, хелперы готовы, партнёрский upload стабилен.

---

### Этап 1 — Партнёры: довести до целевой модели URL

Уже есть upload/delete в S3. Осталось:

1. Скрипт миграции (уже есть): `npm run db:migrate-logos-s3` — прогнать на VPS, `failed=0`.
2. Заменить все `src={`/api/content/partners/${id}/logo`}` на публичный URL из ключа:
   - `landing-partner-card.tsx`
   - `affiliate-steam-section.tsx`
   - `affiliate-cases-grid.tsx` / `cases-ui.ts`
   - `PartnersEditor.tsx`
3. GET `/api/content/partners/[id]/logo`: оставить 302 на переходный период **или** удалить после замены всех потребителей.
4. Убедиться, что list API по-прежнему отдаёт key; UI сам резолвит URL (или API добавляет computed `logo_public_url` — опционально, не обязательно если есть `NEXT_PUBLIC_YA_PUBLIC_BASE`).

**Критерий:** нет base64 в `partners.logo_url`; картинки грузятся с `storage.yandexcloud.net` (или кастомного endpoint).

---

### Этап 2 — Аватары каналов (base64 → S3)

1. Модуль `lib/s3/channel-avatar.ts`.
2. `POST/DELETE` `app/api/content/channels/avatar` → Sharp → S3 → в `channels.avatar` писать key.
3. При delete channel — удалять объект S3.
4. UI (`channels.tsx`, `ChannelsEditor`) → public URL.
5. Миграция: `scripts/migrate-channel-avatars-to-s3.ts`  
   - читать base64 → upload → update row → идемпотентно skip если уже key.
6. npm script: `db:migrate-channel-avatars-s3`.
7. Удалить/свести к 302 GET `[id]/avatar`.

**Критерий:** колонка `avatar` без огромных base64; главная/админка показывают аватары с S3.

---

### Этап 3 — Иконки about-cards (base64 → S3)

Аналогично этапу 2:

1. `lib/s3/about-icon.ts`
2. Upload/delete API → S3, в `icon_image` — key
3. Миграция `scripts/migrate-about-icons-to-s3.ts`
4. Фронт about + админка → public URL
5. Cleanup GET icon route

**Критерий:** `about_cards.icon_image` — keys или null.

---

### Этап 4 — Site logo & favicon (base64 → S3)

1. `lib/s3/site-assets.ts` для `site/logo-*.webp`, `site/favicon-*.webp`.
2. `site_settings.logo` / `site_settings.favicon` хранят key.
3. Обновить `app/api/site/logo` и `favicon` (upload/delete + отдача).
4. Потребители: `header`, `footer`, `middleware` maintenance HTML, `SiteSettingsEditor`.
5. Миграция `scripts/migrate-site-branding-to-s3.ts` (одна строка settings).
6. Для favicon в `<link rel="icon">` — публичный URL + cache-bust по version/hash ключа.

**Критерий:** branding не из SQLite blob.

---

### Этап 5 — Фоны hero / global (диск → S3)

Сейчас: файлы в `public/backgrounds/` + API читает с диска.

Целевая модель (рекомендуется):

1. В `site_settings` (или отдельная таблица/JSON) хранить **ключи** по слотам, например:
   - `bg_hero_light`, `bg_hero_dark`
   - `bg_global_light`, `bg_global_dark`
   - `bg_affiliate_hero_light`, … (те же scope/theme, что сейчас в query)
2. Upload API пишет в S3 и сохраняет key в settings.
3. Фронт берёт public URL из settings (SSR props), без `/api/site/backgrounds/...` на каждый paint.
4. Миграция `scripts/migrate-backgrounds-to-s3.ts`:  
   прочитать существующие файлы с диска → upload → записать keys → (опционально) удалить локальные файлы после проверки.
5. `hasGlobalBackgroundThemes` перевести с `fs.access` на «ключ задан в settings».
6. Удалить зависимость от `public/backgrounds/*.webp` в рантайме (файлы можно оставить в git как fallback на 1 релиз — не обязательно).

**Критерий:** фоны отдаются с S3; VPS-диск не растёт от замен фонов.

**Статус (код):** колонка `site_settings.backgrounds` (JSON ключей), upload/GET/DELETE → S3 + disk fallback, SSR `resolveBackgroundSrc`, миграция `npm run db:migrate-backgrounds-s3`.

---

### Этап 6 — Блог: обложки, видео, inline upload (local → S3)

1. Перевести `putBlogImageToPublic` / video upload на `lib/s3/blog-assets.ts` (убрать запись в `public/uploads`).
2. В постах/полях обложки хранить **публичный URL** (как сейчас path `/uploads/...`) **или** key + резолв при чтении.  
   **Рекомендация:** для обложки в отдельном поле БД — **key**; для HTML TipTap — сразу вставлять **публичный URL** (иначе при смене bucket ломается старый HTML — см. риски).
3. Миграция файлов:
   - `scripts/migrate-blog-uploads-to-s3.ts` — обход `public/uploads/blog/**` → S3.
   - `scripts/rewrite-blog-html-upload-urls.ts` — заменить `/uploads/blog/...` на public S3 URL в контенте постов.
4. Delete API блога — `DeleteObject` вместо `fs.unlink`.
5. Удалить `lib/blog-local-upload.ts` после стабилизации (или оставить thin wrapper).

**Критерий:** новые upload только в S3; старые URL переписаны или редиректятся.

**Статус (код):** `lib/s3/blog-assets.ts` + upload/video/delete → S3; обложка = key; TipTap = public URL; legacy delete с диска; миграции `db:migrate-blog-uploads-s3` + `db:rewrite-blog-html-s3-urls`.

---

### Этап 7 — Рефактор URL по всему фронту + cleanup API

1. Grep: `/api/content/.*/(logo|avatar|icon)`, `/api/site/(logo|favicon|backgrounds)`, `/uploads/blog`.
2. Заменить на public URL helper.
3. Удалить мёртвые GET binary routes и legacy base64 ветки.
4. Обновить админские preview (`?ts=` можно оставить как query на S3 URL для cache-bust при том же ключе — лучше менять ключ при upload, тогда `?ts` не нужен).
5. Документация в `.env.example`: все `YA_*` + `NEXT_PUBLIC_YA_PUBLIC_BASE`.

**Критерий:** нет отдачи изображений из SQLite; минимальный набор API только для upload/delete (auth).

**Статус (код):** GET binary routes удалены; хелперы → public S3 / static `/logo.jpg` / `/backgrounds/*`; settings `meta.background_presence`; `NEXT_PUBLIC_YA_PUBLIC_BASE` обязателен для клиентских URL.

---

### Этап 8 — Harden / наблюдение

1. Логи ошибок S3 (без секретов).
2. Ограничения MIME/size уже есть — сохранить единый assert.
3. Бэкап: SQLite без блобов + политика lifecycle бакета (по желанию).
4. Проверка прав сервисного аккаунта: `storage.uploader` / `storage.editor` по необходимости.

---

## 5. Миграции base64 / файлов → S3 (операционный runbook)

Общий алгоритм **каждого** скрипта:

1. `getYaStorageEnv()` — fail fast.
2. Выбрать строки/файлы-кандидаты.
3. Если значение уже S3-key с нужным префиксом → skip.
4. Если base64 → `Buffer.from(value, "base64")` → `putPublicObject` → `UPDATE` key.
5. Если файл на диске → read → put → update ссылок.
6. Печать summary: `migrated / skipped / failed`.
7. Exit code `1` при `failed > 0`.
8. Идемпотентность: повторный запуск безопасен.

### Порядок прогона на VPS

```text
1. Задеплоить код этапа N + env
2. npm run build && restart app
3. npm run db:migrate-<entity>-s3
4. Смоук-тест UI
5. Следующий этап
```

Не запускать все миграции одним махом в первый раз на проде: **по сущностям**, с проверкой между этапами.

Уже есть:

- `npm run db:migrate-logos-s3` → `scripts/migrate-partner-logos-to-s3.ts`

Добавить по мере этапов:

- `db:migrate-channel-avatars-s3`
- `db:migrate-about-icons-s3`
- `db:migrate-site-branding-s3`
- `db:migrate-backgrounds-s3`
- `db:migrate-blog-uploads-s3`
- `db:rewrite-blog-html-s3-urls` (если нужен отдельно)

---

## 6. Рекомендуемый порядок внедрения (сводка)

| # | Этап | Риск | Зависимости |
|---|---|---|---|
| 0 | Env + shared URL helpers | Низкий | — |
| 1 | Partners URL cleanup + migrate leftovers | Низкий | 0 |
| 2 | Channels avatars | Средний | 0 |
| 3 | About icons | Низкий | 0 |
| 4 | Site logo/favicon | Средний (header везде) | 0 |
| 5 | Backgrounds | Средний | 0, желательно 4 |
| 6 | Blog uploads + HTML rewrite | Высокий | 0 |
| 7 | Cleanup API proxies | Низкий | 1–6 |
| 8 | Harden | — | 7 |

---

## 7. Риски и митигации

| Риск | Митигация |
|---|---|
| Бакет не публичный → 403 на img | Чеклист этапа 0: открыть тестовый object URL |
| Миграция оборвалась | Идемпотентные скрипты; не удалять base64/файлы до `failed=0` |
| Кеш браузера старых `/api/...` | 302 redirect 1–2 релиза или cache-bust |
| HTML блога со старыми `/uploads/...` | rewrite-скрипт + временный rewrite в Next redirects |
| Раздувание SQLite до миграции | Приоритет P1 каналы/about |
| Случайный commit секретов | Только `.env.example` без значений; `.env.local` в gitignore |
| Смена bucket/endpoint | Keys в БД стабильны; меняется только `YA_*` / `NEXT_PUBLIC_YA_PUBLIC_BASE` |

---

## 8. Definition of Done (весь проект)

- [ ] Все новые upload медиа идут только в S3.
- [ ] В SQLite нет base64 изображений (partner/channel/about/site).
- [ ] Рантайм не зависит от `public/uploads/blog` и `public/backgrounds` для CMS-контента.
- [ ] Фронт использует публичные S3 URL (не binary API из БД).
- [ ] На VPS прогнаны миграционные скрипты, `failed=0`.
- [ ] Удалены legacy ветки base64 в GET-роутах.
- [ ] `.env.example` и этот документ актуальны.

---

## 9. Вне скоупа (сознательно)

- CDN перед бакетом (можно позже через Yandex CDN).
- Несколько размеров/вариантов одного изображения (srcset) — отдельная задача.
- Приватные объекты + signed URL — не нужны при текущей публичной модели.
- Миграция исторических TipTap-картинок с внешних доменов — только если встретятся.

---

## 10. Следующий конкретный шаг

**Этап 7 (код):** cleanup binary GET; фронт на public URL helpers; `.env.example` актуален.

Дальше: смоук после миграций на VPS → **Этап 8** (harden).
