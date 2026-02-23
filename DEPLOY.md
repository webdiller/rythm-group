# Выгрузка проекта на VPS

Проект: Next.js 16 + SQLite (Drizzle). Ниже — варианты от простого к автоматизированному.

---

## Подготовка VPS: Git, nvm и клонирование приватного репозитория

Выполните на сервере один раз (Ubuntu/Debian).

### Установка Git

```bash
sudo apt-get update
sudo apt-get install -y git
git --version
```

### Установка nvm (Node Version Manager)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Перезагрузить оболочку или выполнить:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20
node -v
npm -v
```

Чтобы nvm подхватывался при каждом входе по SSH, добавьте в `~/.bashrc` (или `~/.profile`):

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

### Скачивание приватного проекта (Git)

Есть два способа — **SSH** (удобно для постоянной работы) и **HTTPS с токеном** (разовый доступ).

**Вариант A: SSH-ключ (рекомендуется)**

1. Сгенерировать ключ на VPS (пароль можно оставить пустым):
   ```bash
   ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/id_ed25519_github -N ""
   cat ~/.ssh/id_ed25519_github.pub
   ```
2. Скопировать вывод и добавить в GitHub: **Settings → SSH and GPG keys → New SSH key**.
3. Клонировать по SSH-URL (в репозитории кнопка **Code → SSH**):
   ```bash
   mkdir -p /var/www
   cd /var/www
   git clone git@github.com:ВАШ_ЛОГИН/project-kwork-landing.git
   cd project-kwork-landing
   ```

При первом подключении к GitHub подтвердите отпечаток: `yes`.

**Вариант B: HTTPS с персональным токеном (Personal Access Token)**

1. В GitHub: **Settings → Developer settings → Personal access tokens → Generate new token**. Выдать права `repo`.
2. Клонировать (подставить свой логин и токен вместо `ТОКЕН`):
   ```bash
   mkdir -p /var/www
   cd /var/www
   git clone https://ВАШ_ЛОГИН:ТОКЕН@github.com/ВАШ_ЛОГИН/project-kwork-landing.git
   cd project-kwork-landing
   ```
   Чтобы не хранить токен в URL, можно клонировать без токена и при первом `git pull` ввести логин и токен как пароль, либо настроить Git credential helper.

Для последующих `git pull` при использовании SSH ключа ничего вводить не нужно. При HTTPS с токеном — либо сохранить учётные данные (credential helper), либо каждый раз вводить токен.

---

## 1. Ручной деплой (минимальные команды)

Подключитесь к VPS по SSH. Установите Git и nvm по разделу «Подготовка VPS» выше, затем:

```bash
# Node.js 20 уже должен быть (nvm use 20), иначе: nvm install 20 && nvm use 20

# Перейти в папку проекта (после клонирования приватного репо по инструкции выше)
cd /var/www/project-kwork-landing

# Зависимости и сборка
npm ci
npm run build

# Переменные окружения (создайте .env.local или экспортируйте)
export NODE_ENV=production
export JWT_SECRET="ваш-секретный-ключ"
# опционально: export DB_PATH=/var/www/project-kwork-landing/data/cms.db

# Запуск через PM2 (чтобы приложение не падало и перезапускалось)
sudo npm install -g pm2
pm2 start npm --name "kwork-landing" -- start
pm2 save
pm2 startup  # автозапуск после перезагрузки сервера
```

Проксирование Nginx на порт 3000 (опционально):

```nginx
# /etc/nginx/sites-available/kwork-landing
server {
    listen 80;
    server_name ваш-домен.ru;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kwork-landing /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 2. Деплой через Docker (простой и повторяемый)

На VPS должны быть установлены Docker и Docker Compose.

### Первый запуск на VPS

```bash
cd /var/www
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> project-kwork-landing
cd project-kwork-landing
```

Создайте файл `.env` (или `.env.production`) в корне проекта:

```env
NODE_ENV=production
JWT_SECRET=ваш-секретный-ключ
# Логины админки (необязательно): логин:пароль через запятую
# ADMIN_USERS=admin:пароль1,user2:пароль2
# DB_PATH по умолчанию: ./data/cms.db внутри контейнера
```

Сборка и запуск:

```bash
docker compose up -d --build
```

Приложение будет на порту **3000**. Для продакшена настройте Nginx как в пункте 1 (proxy_pass на `127.0.0.1:3000`).

### Обновление после изменений в коде

```bash
cd /var/www/project-kwork-landing
git pull
docker compose up -d --build
```

База SQLite хранится в volume `app_data`, данные не пропадут при пересборке.

---

## 3. Автоматический деплой при push (GitHub Actions)

При пуше в ветку `main` можно автоматически деплоить на VPS через SSH.

### Настройка на VPS

1. Создайте пользователя для деплоя (опционально):
   ```bash
   sudo adduser deploy
   sudo usermod -aG docker deploy  # если используете Docker
   ```

2. SSH-ключ для GitHub Actions:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/deploy_key -N ""
   cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys
   ```
   Приватный ключ `deploy_key` добавьте в секреты репозитория (см. ниже).

### Секреты в GitHub

В репозитории: **Settings → Secrets and variables → Actions** добавьте:

| Секрет        | Описание                          |
|---------------|-----------------------------------|
| `VPS_HOST`    | IP или домен VPS                  |
| `VPS_USER`    | SSH-пользователь (например `root`) |
| `VPS_SSH_KEY` | Содержимое файла `deploy_key`    |

### Workflow

Файл `.github/workflows/deploy.yml` уже добавлен в проект. При `git push origin main` workflow подключается к VPS по SSH и выполняет `git pull` и `docker compose up -d --build` в папке проекта. Если проект на VPS лежит не в `/var/www/project-kwork-landing` и не в `~/project-kwork-landing`, отредактируйте в `deploy.yml` строку с `cd`.

---

## Краткая шпаргалка команд

| Действие           | Команды |
|--------------------|--------|
| Ручной деплой      | `git clone ... && npm ci && npm run build && pm2 start npm -- start` |
| Docker             | `docker compose up -d --build` |
| Обновление (Docker)| `git pull && docker compose up -d --build` |
| Логи (PM2)         | `pm2 logs kwork-landing` |
| Логи (Docker)      | `docker compose logs -f` |

Рекомендуемый вариант для простоты и повторяемости: **Docker (п. 2)**. Для полной автоматизации после каждого push — **п. 3**.

---

## 4. Локальный скрипт деплоя (без GitHub Actions)

Если не используете GitHub Actions, можно деплоить одной командой с вашего компьютера:

```bash
chmod +x deploy.sh
./deploy.sh root@ваш-ip
# или: VPS_USER=deploy VPS_HOST=ваш-ip ./deploy.sh
```

Скрипт подключится по SSH и выполнит `git pull` и `docker compose up -d --build` в папке проекта на сервере. На VPS проект должен быть заранее склонирован (см. п. 2).
