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

> Production на VPS — см. инструкции ниже (Docker или PM2).

## Production / VPS

- **Простой путь (публичный репо, Node + PM2, ручной `git pull`):** [DEPLOY_VPS_PM2.md](./DEPLOY_VPS_PM2.md)
- **Docker + nginx + GitHub Actions:** [DEPLOY_VPS.md](./DEPLOY_VPS.md)

Быстрая подготовка Ubuntu под Docker: `scripts/vps-bootstrap.sh` (только на сервере; см. раздел «Быстрый старт» в DEPLOY_VPS.md).
