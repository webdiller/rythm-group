#!/bin/bash
# Простой деплой на VPS: подставляет переменные и выполняет команды по SSH.
# Использование: ./deploy.sh [user@host]
# Требует: VPS_HOST и VPS_USER в .env или передать user@host аргументом.

set -e
TARGET="${1:-$VPS_USER@$VPS_HOST}"
if [ -z "$TARGET" ] || [ "$TARGET" = "@" ]; then
  echo "Usage: ./deploy.sh user@host"
  echo "Or set VPS_USER and VPS_HOST in environment"
  exit 1
fi

echo "Deploying to $TARGET..."
ssh "$TARGET" "cd /var/www/project-kwork-landing 2>/dev/null || cd ~/project-kwork-landing || (echo 'Directory not found. Clone repo first.' && exit 1) && git pull && docker compose up -d --build"
