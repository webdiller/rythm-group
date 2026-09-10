#!/usr/bin/env bash
# =============================================================================
# Первичная подготовка Ubuntu VPS под rythm-group (Docker + nginx).
#
# Где выполнять: на VPS (по SSH), от пользователя с sudo.
# Не запускайте на своей рабочей машине Windows/macOS.
#
# Пример (публичный репозиторий):
#   curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/vps-bootstrap.sh | bash
# или после клона:
#   cd /var/www/rythm-group && bash scripts/vps-bootstrap.sh
#
# Переменные окружения (опционально):
#   APP_DIR=/var/www/rythm-group
#   REPO_URL=https://github.com/OWNER/REPO.git   # или git@github.com:OWNER/REPO.git
#   DOMAIN=example.com                           # для шаблона nginx
#   DEPLOY_USER=deploy                           # если сейчас вы root — создать/использовать этого пользователя
#   SKIP_APT=1                                   # не apt update/upgrade/install
#   SKIP_DOCKER_INSTALL=1                        # Docker уже установлен
#   START_APP=1                                  # docker compose up -d --build (нужен заполненный .env)
# =============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/rythm-group}"
REPO_URL="${REPO_URL:-}"
DOMAIN="${DOMAIN:-}"
SKIP_APT="${SKIP_APT:-0}"
SKIP_DOCKER_INSTALL="${SKIP_DOCKER_INSTALL:-0}"
START_APP="${START_APP:-0}"
# Явно заданный пользователь деплоя (обязателен, если скрипт запущен от root)
DEPLOY_USER_ENV="${DEPLOY_USER:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { printf '%b\n' "${GREEN}[bootstrap]${NC} $*"; }
warn() { printf '%b\n' "${YELLOW}[bootstrap]${NC} $*"; }
err() { printf '%b\n' "${RED}[bootstrap]${NC} $*" >&2; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    err "Нужна команда: $1"
    exit 1
  }
}

# root → перезапуск от обычного пользователя (типичный «голый» VPS)
if [[ "${EUID:-$(id -u)}" -eq 0 ]]; then
  if [[ -z "$DEPLOY_USER_ENV" || "$DEPLOY_USER_ENV" == "root" ]]; then
    err "Скрипт нельзя выполнять целиком как root без DEPLOY_USER."
    echo
    echo "Вариант A — создать пользователя и войти под ним:"
    echo "  adduser deploy"
    echo "  usermod -aG sudo deploy"
    echo "  su - deploy"
    echo "  bash /path/to/vps-bootstrap.sh"
    echo
    echo "Вариант B — одной командой от root (создаст пользователя deploy при необходимости):"
    echo "  DEPLOY_USER=deploy REPO_URL=https://github.com/OWNER/REPO.git bash vps-bootstrap.sh"
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
  # sudo без пароля для bootstrap (удобно на свежем VPS)
  echo "${TARGET_USER} ALL=(ALL) NOPASSWD:ALL" >"/etc/sudoers.d/${TARGET_USER}-bootstrap"
  chmod 440 "/etc/sudoers.d/${TARGET_USER}-bootstrap"

  SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
  if [[ ! -r "$SCRIPT_PATH" ]]; then
    err "Не могу прочитать скрипт: ${SCRIPT_PATH}"
    exit 1
  fi
  # Чтобы пользователь мог читать скрипт из /root или чужой папки
  chmod a+rX "$(dirname "$SCRIPT_PATH")" 2>/dev/null || true
  chmod a+r "$SCRIPT_PATH" 2>/dev/null || true

  log "Перезапуск от пользователя ${TARGET_USER}…"
  exec sudo -u "$TARGET_USER" -H env \
    APP_DIR="$APP_DIR" \
    REPO_URL="$REPO_URL" \
    DOMAIN="$DOMAIN" \
    SKIP_APT="$SKIP_APT" \
    SKIP_DOCKER_INSTALL="$SKIP_DOCKER_INSTALL" \
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
# A1. Базовые пакеты
# ---------------------------------------------------------------------------
if [[ "$SKIP_APT" != "1" ]]; then
  log "apt update / upgrade / базовые пакеты…"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    git curl ca-certificates nginx certbot python3-certbot-nginx gnupg lsb-release
else
  warn "SKIP_APT=1 — пропуск установки пакетов"
fi

# ---------------------------------------------------------------------------
# A2. Docker Engine + Compose plugin
# ---------------------------------------------------------------------------
if [[ "$SKIP_DOCKER_INSTALL" != "1" ]]; then
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    log "Docker уже установлен — пропуск установки"
  else
    log "Установка Docker Engine…"
    if [[ ! -f /etc/os-release ]]; then
      err "Ожидается Ubuntu/Debian (/etc/os-release)"
      exit 1
    fi
    # shellcheck source=/dev/null
    . /etc/os-release
    CODENAME="${VERSION_CODENAME:-}"
    if [[ -z "$CODENAME" ]]; then
      err "Не удалось определить VERSION_CODENAME"
      exit 1
    fi

    sudo install -m 0755 -d /etc/apt/keyrings
    if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      sudo chmod a+r /etc/apt/keyrings/docker.gpg
    fi

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu ${CODENAME} stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

    sudo apt-get update -y
    sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
      docker-ce docker-ce-cli containerd.io docker-compose-plugin
  fi
else
  warn "SKIP_DOCKER_INSTALL=1 — пропуск установки Docker"
fi

if ! groups "$DEPLOY_USER" | grep -qw docker; then
  log "Добавляю ${DEPLOY_USER} в группу docker…"
  sudo usermod -aG docker "$DEPLOY_USER"
  warn "Чтобы docker без sudo заработал — перелогиньтесь по SSH (newgrp docker или exit + ssh снова)."
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
    warn "${APP_DIR} не пуст и это не git-репозиторий — клон пропущен"
  fi
else
  if [[ ! -f "${APP_DIR}/docker-compose.yml" ]]; then
    warn "REPO_URL не задан и в ${APP_DIR} нет docker-compose.yml."
    warn "Склонируйте репо вручную или перезапустите: REPO_URL=https://github.com/OWNER/REPO.git bash scripts/vps-bootstrap.sh"
  fi
fi

mkdir -p "${APP_DIR}/data" "${APP_DIR}/public/uploads"

if [[ -f "${APP_DIR}/.env.example" && ! -f "${APP_DIR}/.env" ]]; then
  cp "${APP_DIR}/.env.example" "${APP_DIR}/.env"
  log "Создан ${APP_DIR}/.env из .env.example — ОБЯЗАТЕЛЬНО заполните секреты (JWT, ADMIN, YA_*, SMTP, NEXT_PUBLIC_*)."
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
# Сгенерировано scripts/vps-bootstrap.sh — при необходимости поправьте server_name
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
# Опциональный старт приложения
# ---------------------------------------------------------------------------
if [[ "$START_APP" == "1" ]]; then
  if [[ ! -f "${APP_DIR}/.env" ]]; then
    err "START_APP=1, но нет ${APP_DIR}/.env"
    exit 1
  fi
  if grep -qE 'JWT_SECRET=JWT_SECRET|NEXT_PUBLIC_SITE_URL="ВАШ_ДОМЕН"|YA_STORAGE_ID=$' "${APP_DIR}/.env" 2>/dev/null; then
    warn "Похоже, .env ещё с плейсхолдерами. Заполните его перед START_APP=1."
    warn "Пропуск docker compose up."
  else
    log "docker compose up -d --build…"
    # sg docker — если группа уже есть, но сессия старая
    if groups | grep -qw docker || id -nG | grep -qw docker; then
      (cd "$APP_DIR" && docker compose up -d --build)
    else
      sudo -u "$DEPLOY_USER" -H bash -lc "cd '$APP_DIR' && sg docker -c 'docker compose up -d --build'" \
        || (cd "$APP_DIR" && sudo docker compose up -d --build)
    fi
    (cd "$APP_DIR" && docker compose ps) || true
  fi
fi

# ---------------------------------------------------------------------------
# Итог
# ---------------------------------------------------------------------------
echo
log "Готово (базовая подготовка)."
echo
echo "Дальше вручную:"
echo "  1) Перелогиньтесь по SSH (если только что добавили в группу docker)."
echo "  2) Заполните ${APP_DIR}/.env (JWT_SECRET, ADMIN_USERS, SMTP, YA_*, NEXT_PUBLIC_*)."
echo "  3) cd ${APP_DIR} && docker compose up -d --build"
echo "  4) DNS A-записи @ и www → IP этого VPS."
if [[ -n "$DOMAIN" ]]; then
  echo "  5) sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
else
  echo "  5) sudo certbot --nginx -d example.com -d www.example.com"
fi
echo "  6) Автодеплой: Secrets VPS_HOST / VPS_USER / VPS_SSH_KEY (см. DEPLOY_VPS.md § A8)."
echo
echo "Полезные команды:"
echo "  docker compose -f ${APP_DIR}/docker-compose.yml ps"
echo "  docker compose -f ${APP_DIR}/docker-compose.yml logs -f --tail=100 app"
echo "  curl -I http://127.0.0.1:3000"
echo
log "Подробности: DEPLOY_VPS.md"
