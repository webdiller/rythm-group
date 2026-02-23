#!/bin/sh
set -e
# Применяем схему БД при первом запуске (идемпотентно)
npm run db:push 2>/dev/null || true
exec npm start
