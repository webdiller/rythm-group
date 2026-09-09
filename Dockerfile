# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependencies (native: better-sqlite3, sharp) ---
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM base AS builder
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* вшиваются в клиентский бандл на этапе build
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_YA_PUBLIC_BASE
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_YA_PUBLIC_BASE=$NEXT_PUBLIC_YA_PUBLIC_BASE
ENV NODE_ENV=production

# Не prune'им: на VPS нужны tsx и скрипты миграции/бэкапа внутри контейнера
RUN npm run build

# --- runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/tsconfig.json ./

RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000

# SQLite лежит на volume ./data → /app/data (не перезаписывается при rebuild)
# Процесс от root в контейнере — типично для single-tenant VPS с bind-mount;
# каталог data/ на хосте должен принадлежать пользователю деплоя.
CMD ["npm", "start"]
