# rythm-group

Next.js лендинг + CMS (SQLite, медиа в Yandex Object Storage).

## Локальная разработка

### Вариант A — Node на хосте

```bash
cp .env.example .env.local   # заполните JWT, ADMIN_USERS, YA_*, NEXT_PUBLIC_*
npm ci
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Вариант B — Docker (hot reload)

Нужны Docker Desktop / Docker Engine + Compose plugin.

```bash
cp .env.example .env         # или .env.local — оба подхватываются
mkdir -p data public/uploads
npm run dev:docker
# эквивалент: docker compose -f docker-compose.dev.yml up --build
```

- Приложение: [http://localhost:3000](http://localhost:3000)
- Исходники монтируются с хоста; `node_modules` — отдельный Linux-volume (нужен для `better-sqlite3`)
- На Windows/macOS включён polling для HMR (`WATCHPACK_POLLING`)

Остановка: `Ctrl+C`, затем при необходимости `docker compose -f docker-compose.dev.yml down`.

> Production на VPS — другие файлы: `Dockerfile` + `docker-compose.yml`. См. [DEPLOY_VPS.md](./DEPLOY_VPS.md).

## Production / VPS

Полная инструкция (чистый VPS, миграция с PM2, бэкапы в Object Storage, CI): **[DEPLOY_VPS.md](./DEPLOY_VPS.md)**.
