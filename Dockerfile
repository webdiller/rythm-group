# Сборка и запуск Next.js с SQLite на VPS
FROM node:20-alpine

# Нативные зависимости для better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 3000

VOLUME /app/data

ENTRYPOINT ["/app/docker-entrypoint.sh"]
