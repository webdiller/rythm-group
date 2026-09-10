# Развёртывание на VPS (Docker + nginx + Let’s Encrypt)

Инструкция для программиста. Стек production:

| Компонент                 | Роль                                                          |
| ------------------------- | ------------------------------------------------------------- |
| **Docker Compose**        | Сборка и запуск Next.js                                       |
| **nginx**                 | Reverse proxy, HTTPS, редиректы www ↔ apex                    |
| **SQLite**                | Файл `./data/cms.db` на volume (не уничтожается при redeploy) |
| **Yandex Object Storage** | Медиа CMS + бэкапы БД                                         |
| **GitHub Actions**        | Push в `main` → SSH на VPS → `git pull` → бэкап → Docker (см. **A8**) |

Схема миграций БД: при старте приложения `getDb()` вызывает `runMigrations()` — отдельно `drizzle-kit push` на проде обычно не нужен. **Каталог `data/` не удалять** при обновлениях.

Канонический путь на сервере: `/var/www/rythm-group`.

Локальный hot reload в Docker: `Dockerfile.dev` + `docker-compose.dev.yml` (см. раздел **E** и [README.md](./README.md)) — на VPS не применять.

---

## A. Чистый VPS (с нуля)

### Быстрый старт (опционально): `scripts/vps-bootstrap.sh`

> **Где выполнять:** на **VPS** (Ubuntu), пользователь с `sudo`. Не на локальной Windows/macOS.

Скрипт ставит пакеты, Docker, готовит `/var/www/rythm-group`, копирует `.env.example` → `.env` (без секретов), пишет базовый nginx → `:3000`.  
**Не** подставляет JWT/S3/SMTP и **не** выпускает HTTPS сам — это остаётся ручным шагом.

```bash
# Вариант 1: уже склонировали репозиторий
cd /var/www/rythm-group   # или куда клонировали
bash scripts/vps-bootstrap.sh

# Вариант 2: клон + bootstrap одной командой (публичный репо — HTTPS)
REPO_URL=https://github.com/OWNER/REPO.git \
DOMAIN=example.com \
bash -c 'curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/vps-bootstrap.sh | bash'

# После заполнения .env можно сразу поднять приложение:
# START_APP=1 bash scripts/vps-bootstrap.sh
```

Переменные: `APP_DIR`, `REPO_URL`, `DOMAIN`, `DEPLOY_USER`, `SKIP_APT=1`, `SKIP_DOCKER_INSTALL=1`, `START_APP=1`.

Если на VPS вы вошли как **root** (часто так по умолчанию):

```bash
# Рекомендуется — одной командой создаст пользователя deploy и продолжит от него:
DEPLOY_USER=deploy REPO_URL=https://github.com/OWNER/REPO.git bash vps-bootstrap.sh

# Или вручную:
adduser deploy && usermod -aG sudo deploy && su - deploy
bash /path/to/vps-bootstrap.sh
```

Дальше всё равно выполните заполнение `.env`, DNS, certbot и при необходимости **A8** (автодеплой). Ниже — те же шаги вручную (A1–A9).

### A1. Базовая подготовка

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates nginx certbot python3-certbot-nginx
```

### A2. Docker Engine + Compose plugin

```bash
# Официальный репозиторий Docker (Ubuntu)
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker "$USER"
# Перелогиньтесь по SSH, затем:
docker version
docker compose version
```

### A3. Каталог проекта и SSH к GitHub (ключ «VPS → GitHub»)

> **Где выполнять:** шаги ниже — на **VPS** (по SSH), кроме добавления публичного ключа в веб-интерфейс GitHub (это в браузере на любой машине).

Нужен отдельный ключ, чтобы на сервере работал `git pull` / `git clone` из **приватного** репозитория.  
Это **не** тот же ключ, что `VPS_SSH_KEY` для GitHub Actions (см. **A8**).

**На VPS:**

```bash
sudo mkdir -p /var/www/rythm-group
sudo chown "$USER:$USER" /var/www/rythm-group
cd /var/www/rythm-group

# Создать ключ только для доступа к GitHub (если ещё нет подходящего)
ssh-keygen -t ed25519 -C "vps-git-github" -f ~/.ssh/id_ed25519_github -N ""
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519_github

# Показать публичный ключ — его нужно скопировать
cat ~/.ssh/id_ed25519_github.pub
```

**В браузере (GitHub)** — один из вариантов:

1. **Deploy key репозитория** (рекомендуется для одного проекта):  
   репозиторий → **Settings → Deploy keys → Add deploy key** → вставить содержимое `.pub`, доступ **Read-only** достаточно для `git pull`.
2. Или **SSH key аккаунта**: GitHub → **Settings → SSH and GPG keys → New SSH key**.

Если у пользователя на VPS несколько ключей, в `~/.ssh/config` укажите:

```text
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
```

**На VPS — проверка и клон:**

```bash
ssh -T git@github.com
# Ожидается: Hi <user/repo>! You've successfully authenticated...

git clone git@github.com:OWNER/REPO.git .
# HTTPS для приватного репо без токена обычно неудобен — предпочтителен SSH
mkdir -p data public/uploads
```

> Приватный файл `~/.ssh/id_ed25519_github` **не** кладите в GitHub Secrets и **не** коммитьте в репозиторий. Он остаётся только на VPS.

### A4. Переменные окружения

> **Где выполнять:** на **VPS**, в каталоге проекта.

```bash
cp .env.example .env
nano .env
```

Обязательно заполнить:

- `JWT_SECRET` — `openssl rand -base64 32`
- `ADMIN_USERS` — `логин:пароль`
- `NEXT_PUBLIC_SITE_URL` — `https://example.com` (без `/` в конце)
- SMTP-поля
- **Yandex Object Storage:** `YA_STORAGE_ID`, `YA_STORAGE_SECRET`, `YA_BUCKET_NAME`, `YA_REGION`, `YA_ENDPOINT`, `NEXT_PUBLIC_YA_PUBLIC_BASE`

Опционально для бэкапов: `BACKUP_S3_PREFIX=backups/cms`, `BACKUP_KEEP_DAYS=14`.

> `NEXT_PUBLIC_*` передаются в Docker **как build args**. После смены домена или публичного URL бакета нужен **rebuild** (`docker compose up -d --build`), не только restart.

### A5. Первый запуск контейнера

> **Где выполнять:** на **VPS**.

```bash
cd /var/www/rythm-group
docker compose up -d --build
docker compose ps
docker compose logs -f --tail=100 app
```

Проверка с сервера: `curl -I http://127.0.0.1:3000` → ожидается ответ Next.js.

База появится в `./data/cms.db` после первого обращения к приложению (миграции на старте).

### A6. nginx + домен + редиректы www

> **Где выполнять:** DNS — в панели регистратора; конфиг nginx и certbot — на **VPS**.

Пока DNS ещё не настроен, можно открыть сайт по IP (HTTP). Для продакшена:

1. В DNS создайте **A**-записи `@` и `www` на **IP этого VPS**.
2. Дождитесь резолва (`dig +short example.com`).

Конфиг nginx:

```bash
sudo nano /etc/nginx/sites-available/rythm-group
```

```nginx
# HTTP → приложение (certbot позже добавит HTTPS и редирект на https)
server {
    listen 80;
    listen [::]:80;
    server_name example.com www.example.com;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/rythm-group /etc/nginx/sites-enabled/rythm-group
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS и редиректы (apex ↔ www):

```bash
# Выберите канонический хост. Пример: apex канонический, www → apex
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot предложит редирект HTTP→HTTPS. Явный редирект `www` → apex (если certbot не сделал сам) — отдельный `server` блок:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name www.example.com;
    return 301 https://example.com$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name www.example.com;

    # ssl_certificate / ssl_certificate_key — как прописал certbot для www

    return 301 https://example.com$request_uri;
}
```

После правок: `sudo nginx -t && sudo systemctl reload nginx`.

### A7. Бэкапы SQLite → Yandex Object Storage

> **Где выполнять:** на **VPS**.

Разовый бэкап:

```bash
cd /var/www/rythm-group
docker compose exec app node scripts/backup-sqlite-to-s3.mjs
# или с хоста (если есть .env и node_modules): npm run db:backup-s3
```

Cron (ежедневно в 03:15 UTC+0; поправьте TZ при необходимости):

```bash
crontab -e
```

```cron
15 3 * * * cd /var/www/rythm-group && docker compose exec -T app node scripts/backup-sqlite-to-s3.mjs >> /var/log/rythm-db-backup.log 2>&1
```

Объекты кладутся в бакет по ключу вида `backups/cms/cms-<timestamp>.db` (приватные). Старые чистятся по `BACKUP_KEEP_DAYS`.

### A8. GitHub Actions (автодеплой) — ключ «GitHub Actions → VPS»

При **push в ветку `main`** workflow `.github/workflows/deploy.yml` по SSH заходит на VPS и выполняет: `git pull` → `docker compose build` → бэкап БД в S3 → `docker compose up -d`.

Нужны **два разных** SSH-ключа:

| Назначение | Кто → куда | Где лежит приватный ключ |
| ---------- | ---------- | ------------------------ |
| `git pull` на сервере | **VPS → GitHub** | только на VPS (раздел **A3**) |
| Автодеплой | **GitHub Actions → VPS** | Secret `VPS_SSH_KEY` в GitHub (этот раздел) |

---

#### A8.1. Создать ключ для деплоя

> **Где выполнять:** на **локальной машине** разработчика (не обязательно на VPS). Так приватный ключ не смешивается с ключом git на сервере.

```bash
# Локально (Windows Git Bash / macOS / Linux)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ./vps_deploy_ed25519 -N ""
```

Появятся два файла в текущей папке:

| Файл | Что это | Куда |
| ---- | ------- | ---- |
| `vps_deploy_ed25519` | **приватный** ключ | Secret `VPS_SSH_KEY` в GitHub |
| `vps_deploy_ed25519.pub` | **публичный** ключ | `~/.ssh/authorized_keys` на VPS |

> Файлы `vps_deploy_ed25519*` **не коммитить** в репозиторий. После настройки приватный ключ можно удалить с диска локальной машины (он уже сохранён в GitHub Secret) или хранить в менеджере секретов команды.

---

#### A8.2. Публичный ключ на VPS

> **Где выполнять:** на **VPS**, под тем же пользователем, который указан в `VPS_USER` (владелец `/var/www/rythm-group`, доступ к Docker).

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Вставить ОДНУ строку из vps_deploy_ed25519.pub (скопированную с локальной машины)
echo "ssh-ed25519 AAAA... github-actions-deploy" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Пользователь должен уметь запускать docker без sudo
sudo usermod -aG docker "$USER"
# После usermod — перелогиниться по SSH
```

---

#### A8.3. Проверить вход ключом

> **Где выполнять:** на **локальной машине**.

```bash
ssh -i ./vps_deploy_ed25519 USER@VPS_IP
# Подставьте реальные USER и IP. Вход должен пройти без пароля.
```

Если зашли — ключ подходит для Actions.

---

#### A8.4. Secrets в GitHub

> **Где выполнять:** в **браузере** → репозиторий → **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Значение | Откуда взять |
| ------ | -------- | ------------ |
| `VPS_HOST` | IP или hostname VPS | панель хостинга / `hostname -I` на VPS |
| `VPS_USER` | SSH-логин на VPS | тот же, под которым настроены `authorized_keys` и Docker |
| `VPS_SSH_KEY` | **весь** текст приватного файла `vps_deploy_ed25519` | локальный файл: от `-----BEGIN` до `-----END` включительно |

Как скопировать приватный ключ для Secret:

```bash
# Локально
cat ./vps_deploy_ed25519
# Выделить всё содержимое файла и вставить в Value секрета VPS_SSH_KEY
```

На Windows (PowerShell): `Get-Content .\vps_deploy_ed25519 -Raw` — скопировать вывод целиком.

---

#### A8.5. Проверка автодеплоя

> **Где выполнять:** push — с **локальной машины** (или в GitHub UI); логи — в браузере GitHub.

1. Убедитесь, что на VPS проект уже склонирован (A3), есть `.env` (A4), контейнер когда-то успешно собирался.
2. Сделайте commit и `git push origin main`.
3. GitHub → **Actions** → workflow **Deploy to VPS** — статус должен быть зелёным.
4. На VPS: `cd /var/www/rythm-group && docker compose ps` и при необходимости `docker compose logs --tail=50 app`.

Типичные ошибки:

| Симптом | Что проверить |
| ------- | ------------- |
| Actions: Permission denied (publickey) | На VPS нет `.pub` в `authorized_keys`, или в Secret попал публичный ключ / обрезанный приватный |
| Actions: Project directory not found | Нет каталога `/var/www/rythm-group` (и fallback-путей из workflow) |
| `git pull` failed на VPS | Не настроен ключ **A3** (VPS → GitHub) для приватного репо |
| `docker: permission denied` | Пользователь `VPS_USER` не в группе `docker`, сессия не перелогинена |

### A9. Чеклист чистого VPS

- [ ] `docker compose ps` — `app` Up
- [ ] `https://example.com` открывается, замок в браузере
- [ ] `https://www.example.com` редиректит на канонический хост
- [ ] `/dashboard` — вход по `ADMIN_USERS`
- [ ] Загрузка картинки в админке уходит в Yandex Object Storage
- [ ] Бэкап: объект появился в бакете под `backups/cms/`
- [ ] Deploy key / SSH для git на VPS (A3) и Secrets `VPS_*` (A8) настроены
- [ ] Push в `main` успешно проходит в GitHub Actions

---

## B. Текущий VPS (старая версия на PM2, без S3)

Цель: перейти на Docker, не потерять `cms.db`, подключить Yandex Object Storage, сохранить домен/IP.

### B1. Снимок БД и (по желанию) uploads

```bash
# Путь старого деплоя может отличаться — подставьте свой
cd /var/www/rythm-group   # или где лежит проект

pm2 stop rythm-group      # или другое имя процесса: pm2 list
cp -a data/cms.db "data/cms.db.bak-$(date +%Y%m%d-%H%M%S)"
# если есть локальные медиа:
tar -czf "/tmp/uploads-backup-$(date +%Y%m%d).tgz" public/uploads 2>/dev/null || true
```

Скопируйте `cms.db.bak-*` себе на рабочую машину (scp) — страховка вне сервера.

### B2. Установить Docker (не трогая nginx)

Выполните **A2**. nginx и домен оставляем: они уже смотрят на `127.0.0.1:3000`.

### B3. Обновить код и `.env`

```bash
cd /var/www/rythm-group
git fetch origin
git checkout main
git pull

cp .env .env.pre-docker.bak
nano .env
```

Добавьте блок Yandex Object Storage (см. `.env.example`):

```env
YA_STORAGE_ID=...
YA_STORAGE_SECRET=...
YA_BUCKET_NAME=...
YA_REGION=ru-central1
YA_ENDPOINT=https://storage.yandexcloud.net
NEXT_PUBLIC_YA_PUBLIC_BASE=https://storage.yandexcloud.net/ВАШ_БАКЕТ
```

Убедитесь, что `DB_PATH=./data/cms.db` (в compose внутри контейнера принудительно `/app/data/cms.db` на том же volume).

В nginx должен быть `client_max_body_size 20M;` (иначе 413 на загрузках).

### B4. Остановить PM2, поднять Docker

Порт 3000 должен освободиться:

```bash
pm2 stop rythm-group
# при необходимости: pm2 delete rythm-group && pm2 save

mkdir -p data public/uploads
# cms.db уже в data/ — volume подхватит его

docker compose up -d --build
docker compose ps
docker compose logs --tail=80 app
curl -I http://127.0.0.1:3000
```

Сайт по старому домену должен открываться без смены DNS (nginx без изменений или только reload).

Отключить автозапуск PM2 для этого приложения:

```bash
pm2 unstartup   # если больше ничего на PM2 не крутится
# или просто не держать процесс в pm2 save
```

### B5. Миграция локальных/base64 медиа в S3

После того как бакет и ключи рабочие, из каталога проекта:

```bash
# Env уже в контейнере через env_file
docker compose exec app npx tsx scripts/migrate-partner-logos-to-s3.ts
docker compose exec app npx tsx scripts/migrate-channel-avatars-to-s3.ts
docker compose exec app npx tsx scripts/migrate-about-icons-to-s3.ts
docker compose exec app npx tsx scripts/migrate-site-branding-to-s3.ts
docker compose exec app npx tsx scripts/migrate-backgrounds-to-s3.ts
docker compose exec app npx tsx scripts/migrate-blog-uploads-to-s3.ts
docker compose exec app npx tsx scripts/rewrite-blog-html-upload-urls.ts
```

Перед миграцией сделайте бэкап БД (`B1` + `A7`).

### B6. Бэкапы и CI

- Настройте cron как в **A7**.
- Подключите GitHub Secrets и ключ деплоя пошагово как в **A8** (локально создать ключ → `.pub` на VPS → Secrets в GitHub). Путь проекта: `/var/www/rythm-group` или fallback в workflow.

### B7. Чеклист миграции со старого VPS

- [ ] Есть копия `cms.db` вне сервера
- [ ] PM2 остановлен, Docker слушает 3000
- [ ] Домен открывается как раньше (HTTPS не сломан)
- [ ] Медиа в админке/на сайте с URL бакета Yandex
- [ ] `docker compose exec app node scripts/backup-sqlite-to-s3.mjs` успешен
- [ ] Автодеплой с `main` не затирает `./data`

---

## C. Перенос на новый VPS (домен был на старом)

Когда новый сервер настроен по **разделу A**, а старый ещё отвечает по домену:

### C1. Подготовка

1. На новом VPS — полный стек (A1–A7), временный доступ по IP.
2. Заранее снизьте TTL DNS до 300 с (за сутки).
3. Со старого VPS скопируйте актуальную БД:

```bash
# на старом
pm2 stop ...   # или docker compose stop app — чтобы файл не писался
scp user@OLD_IP:/var/www/rythm-group/data/cms.db ./cms.db

# на новый
scp ./cms.db user@NEW_IP:/var/www/rythm-group/data/cms.db
ssh user@NEW_IP 'cd /var/www/rythm-group && docker compose restart app'
```

Медиа уже в S3 — копировать `public/uploads` не обязательно, если миграция в S3 сделана.

### C2. DNS cutover

В панели домена смените **A** (`@` и `www`) на **IP нового VPS**.

На новом VPS получите сертификат (**A6**), если ещё не получали по домену.

### C3. Редиректы на старом VPS (опционально, на время пропагации DNS)

Пока часть клиентов ходит на старый IP, отдавайте 301 на канонический HTTPS-домен:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://example.com$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;
    # можно оставить старые ssl_certificate для прежнего домена
    return 301 https://example.com$request_uri;
}
```

После стабилизации DNS старый VPS можно выключить.

### C4. Что не трогать при переносе

- Содержимое SQLite (кроме бэкапа/копирования файла)
- Секреты `JWT_SECRET` / `ADMIN_USERS` (можно оставить те же)
- Объекты в Yandex Object Storage

---

## D. Операции после деплоя

| Задача               | Команда                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| Логи                 | `docker compose logs -f --tail=200 app`                                             |
| Рестарт              | `docker compose restart app`                                                        |
| Обновление вручную   | `git pull && docker compose up -d --build`                                          |
| Бэкап БД             | `docker compose exec app node scripts/backup-sqlite-to-s3.mjs`                      |
| Восстановление из S3 | скачать `.db` из бакета → положить в `./data/cms.db` → `docker compose restart app` |

### Важно

1. **Volume `./data`** — единственный источник правды для контента CMS. Не монтируйте пустой named volume поверх существующей БД без бэкапа.
2. Смена `NEXT_PUBLIC_SITE_URL` или `NEXT_PUBLIC_YA_PUBLIC_BASE` → обязательный **rebuild**.
3. При ошибке **413** — увеличьте `client_max_body_size` в nginx.
4. Схема БД обновляется кодом при старте контейнера; не удаляйте `data/` «для чистоты».

---

## E. Локальная разработка в Docker

На VPS это **не** используется. Для разработки на машине программиста:

```bash
cp .env.example .env   # или .env.local
mkdir -p data public/uploads
npm run dev:docker
# = docker compose -f docker-compose.dev.yml up --build
```

Файлы: `Dockerfile.dev`, `docker-compose.dev.yml`. Подробнее — [README.md](./README.md).
