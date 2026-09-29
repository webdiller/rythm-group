#!/usr/bin/env bash
# =============================================================================
# Первичная подготовка Ubuntu VPS под rythm-group (Node.js + PM2 + nginx).
#
# Где выполнять: на VPS (по SSH), от пользователя с sudo.
# Не запускайте на своей рабочей машине Windows/macOS.
#
# Docker-вариант: scripts/vps-bootstrap.sh + DEPLOY_VPS.md
# Ручная установка: DEPLOY_VPS_PM2.md §1–5
#
# Пример (публичный репозиторий):
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/vps-bootstrap-pm2.sh | \
#     DEPLOY_USER=deploy REPO_URL=https://github.com/OWNER/REPO.git DOMAIN=example.com bash
# или после клона / rsync:
#   cd /var/www/rythm-group && bash scripts/vps-bootstrap-pm2.sh
#
# Переменные окружения (опционально):
#   APP_DIR=/var/www/rythm-group
#   REPO_URL=https://github.com/OWNER/REPO.git   # клон; без него каталог под rsync с ПК
#   DOMAIN=example.com                           # для шаблона nginx
#   DEPLOY_USER=deploy                           # если сейчас root — создать/использовать этого пользователя
#   SKIP_APT=1                                   # не apt update/upgrade/install
#   SKIP_NODE_INSTALL=1                          # Node уже установлен
#   SKIP_PM2_INSTALL=1                           # PM2 уже установлен
#   START_APP=1                                  # npm ci + build + pm2 start (нужен заполненный .env)
# =============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/rythm-group}"
REPO_URL="${REPO_URL:-}"
DOMAIN="${DOMAIN:-}"
SKIP_APT="${SKIP_APT:-0}"
SKIP_NODE_INSTALL="${SKIP_NODE_INSTALL:-0}"
SKIP_PM2_INSTALL="${SKIP_PM2_INSTALL:-0}"
START_APP="${START_APP:-0}"
DEPLOY_USER_ENV="${DEPLOY_USER:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { printf '%b\n' "${GREEN}[bootstrap-pm2]${NC} $*"; }
warn() { printf '%b\n' "${YELLOW}[bootstrap-pm2]${NC} $*"; }
err() { printf '%b\n' "${RED}[bootstrap-pm2]${NC} $*" >&2; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    err "Нужна команда: $1"
    exit 1
  }
}

# root → перезапуск от обычного пользователя
if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  if [[ -z "$DEPLOY_USER_ENV" || "$DEPLOY_USER_ENV" == "root" ]]; then
    err "Скрипт нельзя выполнять целиком как root без DEPLOY_USER."
    echo
    echo "Вариант A — создать пользователя и войти под ним:"
    echo "  adduser deploy"
    echo "  usermod -aG sudo deploy"
    echo "  su - deploy"
    echo "  bash /path/to/vps-bootstrap-pm2.sh"
    echo
    echo "Вариант B — одной командой от root:"
    echo "  DEPLOY_USER=deploy REPO_URL=https://github.com/OWNER/REPO.git bash vps-bootstrap-pm2.sh"
    echo
    exit 1
  fi

  TARGET_USER="$DEPLOY_USER_ENV"
  if ! id "$TARGET_USER" >/dev/null 2>&1; then
    log "Создаю пользователя ${TARGET_USER}…"
    if command -v adduser >/dev/null 2>&1; then
      adduser --disabled-password --gecos "Deploy" "$TARGET_USER"
    else
      useradd -m -s /bin/bash "$TARGET_USER"
    fi
  fi
  usermod -aG sudo "$TARGET_USER" 2>/dev/null || true
  echo "${TARGET_USER} ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/${TARGET_USER}-bootstrap"
  chmod 440 "/etc/sudoers.d/${TARGET_USER}-bootstrap"

  SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  if [[ ! -r "$SCRIPT_PATH" ]]; then
    err "Не могу прочитать скрипт: ${SCRIPT_PATH}"
    exit 1
  fi
  chmod a+rX "$(dirname "$SCRIPT_PATH")" 2>/dev/null || true
  chmod a+r "$SCRIPT_PATH" 2>/dev/null || true

  log "Перезапуск от пользователя ${TARGET_USER}…"
  exec sudo -u "$TARGET_USER" -H env \
    APP_DIR="$APP_DIR" \
    REPO_URL="$REPO_URL" \
    DOMAIN="$DOMAIN" \
    SKIP_APT="$SKIP_APT" \
    SKIP_NODE_INSTALL="$SKIP_NODE_INSTALL" \
    SKIP_PM2_INSTALL="$SKIP_PM2_INSTALL" \
    START_APP="$START_APP" \
    DEPLOY_USER="$TARGET_USER" \
    HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)" \
    bash "$SCRIPT_PATH"
fi

need_cmd sudo
need_cmd curl

DEPLOY_USER="${DEPLOY_USER_ENV:-${SUDO_USER:-$USER}}"
if [[ "$DEPLOY_USER" == "root" ]]; then
  DEPLOY_USER="$USER"
fi

log "Пользователь деплоя: ${DEPLOY_USER}"
log "Каталог проекта: ${APP_DIR}"

# ---------------------------------------------------------------------------
# Базовые пакеты (без Docker)
# ---------------------------------------------------------------------------
if [[ "$SKIP_APT" != "1" ]]; then
  log "apt update / upgrade / базовые пакеты…"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    git curl ca-certificates nginx certbot python3-certbot-nginx rsync gnupg
else
  warn "SKIP_APT=1 — пропуск установки пакетов"
fi

# ---------------------------------------------------------------------------
# Node.js 22 (NodeSource)
# ---------------------------------------------------------------------------
if [[ "$SKIP_NODE_INSTALL" != "1" ]]; then
  NODE_MAJOR=""
  if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)"
  fi
  if [[ "$NODE_MAJOR" == "22" ]]; then
    log "Node.js 22 уже установлен ($(node -v))"
  else
    log "Установка Node.js 22 (NodeSource)…"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs
    log "Node: $(node -v), npm: $(npm -v)"
  fi
else
  warn "SKIP_NODE_INSTALL=1 — пропуск установки Node"
fi

# ---------------------------------------------------------------------------
# PM2
# ---------------------------------------------------------------------------
if [[ "$SKIP_PM2_INSTALL" != "1" ]]; then
  if command -v pm2 >/dev/null 2>&1; then
    log "PM2 уже установлен ($(pm2 -v))"
  else
    log "Установка PM2 глобально…"
    sudo npm install -g pm2
    log "PM2: $(pm2 -v)"
  fi
else
  warn "SKIP_PM2_INSTALL=1 — пропуск установки PM2"
fi

# ---------------------------------------------------------------------------
# Каталог проекта
# ---------------------------------------------------------------------------
log "Готовлю ${APP_DIR}…"
sudo mkdir -p "$APP_DIR"
sudo chown "${DEPLOY_USER}:${DEPLOY_USER}" "$APP_DIR"

if [[ -n "$REPO_URL" ]]; then
  if [[ -d "${APP_DIR}/.git" ]]; then
    log "Репозиторий уже есть в ${APP_DIR} — git pull"
    git -C "$APP_DIR" pull --ff-only || warn "git pull не удался — проверьте remote/ветку"
  elif [[ -z "$(ls -A "$APP_DIR" 2>/dev/null || true)" ]]; then
    log "Клонирую ${REPO_URL} → ${APP_DIR}"
    git clone "$REPO_URL" "$APP_DIR"
  else
    warn "${APP_DIR} не пуст и это не git-репозиторий — клон пропущен (ожидается rsync с ПК?)"
  fi
else
  if [[ ! -f "${APP_DIR}/package.json" ]]; then
    warn "REPO_URL не задан и в ${APP_DIR} нет package.json."
    warn "Склонируйте репо, задайте REPO_URL=… или скопируйте проект с ПК (rsync), затем повторите bootstrap при необходимости."
  fi
fi

mkdir -p "${APP_DIR}/data" "${APP_DIR}/public/uploads"

if [[ -f "${APP_DIR}/.env.example" && ! -f "${APP_DIR}/.env" ]]; then
  cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
  log "Создан ${APP_DIR}/.env из .env.example — ОБЯЗАТЕЛЬНО заполните секреты (JWT, ADMIN, YA_*, Telegram, NEXT_PUBLIC_*)."
elif [[ -f "${APP_DIR}/.env" ]]; then
  log ".env уже существует — не перезаписываю"
else
  warn "Нет .env.example в проекте — создайте .env вручную"
fi

# ---------------------------------------------------------------------------
# nginx (шаблон HTTP → :3000)
# ---------------------------------------------------------------------------
NGINX_SITE="/etc/nginx/sites-available/rythm-group"
if [[ -n "$DOMAIN" ]]; then
  SERVER_NAMES="${DOMAIN} www.${DOMAIN}"
else
  SERVER_NAMES="_"
fi

if [[ ! -f "$NGINX_SITE" ]]; then
  log "Пишу nginx-сайт ${NGINX_SITE} (server_name: ${SERVER_NAMES})…"
  sudo tee "$NGINX_SITE" >/dev/null <<EOF
# Сгенерировано scripts/vps-bootstrap-pm2.sh — при необходимости поправьте server_name
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES};

    client_max_body_size 20M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host \$host;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/rythm-group
  if [[ -f /etc/nginx/sites-enabled/default ]]; then
    sudo rm -f /etc/nginx/sites-enabled/default
  fi
  sudo nginx -t
  sudo systemctl reload nginx
  log "nginx перезагружен"
else
  log "nginx-сайт уже есть (${NGINX_SITE}) — не перезаписываю"
fi

# ---------------------------------------------------------------------------
# Опциональный старт приложения (PM2)
# ---------------------------------------------------------------------------
if [[ "$START_APP" == "1" ]]; then
  if [[ ! -f "${APP_DIR}/.env" ]]; then
    err "START_APP=1, но нет ${APP_DIR}/.env"
    exit 1
  fi
  if [[ ! -f "${APP_DIR}/package.json" ]]; then
    err "START_APP=1, но нет ${APP_DIR}/package.json — сначала доставьте код (git/rsync)."
    exit 1
  fi
  if grep -qE 'JWT_SECRET=JWT_SECRET|NEXT_PUBLIC_SITE_URL="ВАШ_ДОМЕН"|YA_STORAGE_ID=$' "${APP_DIR}/.env" 2>/dev/null; then
    warn "Похоже, .env ещё с плейсхолдерами. Заполните его перед START_APP=1."
    warn "Пропуск npm ci / build / pm2."
  else
    log "npm ci…"
    (cd "$APP_DIR" && npm ci)
    if [[ -f "${APP_DIR}/package.json" ]] && grep -q '"db:push"' "${APP_DIR}/package.json"; then
      log "npm run db:push…"
      (cd "$APP_DIR" && npm run db:push) || warn "db:push не удался — проверьте DB_PATH / права на data/"
    fi
    log "npm run build…"
    (cd "$APP_DIR" && npm run build)
    if pm2 describe rythm-group >/dev/null 2>&1; then
      log "pm2 reload rythm-group…"
      (cd "$APP_DIR" && pm2 reload rythm-group)
    elif [[ -f "${APP_DIR}/ecosystem.config.cjs" ]]; then
      log "pm2 start ecosystem.config.cjs…"
      (cd "$APP_DIR" && pm2 start ecosystem.config.cjs)
    else
      log "pm2 start npm --name rythm-group -- start…"
      (cd "$APP_DIR" && pm2 start npm --name rythm-group -- start)
    fi
    pm2 save || true
    log "PM2 status:"
    pm2 status || true
  fi
fi

# ---------------------------------------------------------------------------
# Итог
# ---------------------------------------------------------------------------
echo
log "Готово (базовая подготовка Node + PM2 + nginx)."
echo
echo "Дальше вручную (если ещё не сделано):"
echo "  1) Заполните ${APP_DIR}/.env (JWT_SECRET, ADMIN_USERS, YA_*, Telegram, NEXT_PUBLIC_*)."
echo "  2) Если кода ещё нет — git clone / rsync (см. DEPLOY_VPS_PM2.md §2)."
echo "  3) cd ${APP_DIR} && npm ci && npm run db:push && npm run build"
echo "  4) pm2 start ecosystem.config.cjs && pm2 save && pm2 startup"
echo "  5) DNS A-записи @ и www → IP этого VPS."
if [[ -n "$DOMAIN" ]]; then
  echo "  6) sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  echo "  6) sudo certbot --nginx -d example.com -d www.example.com"
fi
echo
echo "Полезные команды:"
echo "  pm2 status"
echo "  pm2 logs rythm-group --lines 100"
echo "  curl -I http://127.0.0.1:3000"
echo
log "Подробности: DEPLOY_VPS_PM2.md"
log "Docker-стек: scripts/vps-bootstrap.sh + DEPLOY_VPS.md"
