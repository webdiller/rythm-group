# Развёртывание на VPS (Node.js + PM2 + nginx)

Доставка кода на сервер — **любым** из двух способов (можно использовать оба в разное время):

1. **Git** — `git clone` / `git pull` с публичного GitHub (HTTPS).
2. **Копирование с ПК** — `rsync` / `scp` локальной папки проекта на VPS (без GitHub).

После появления файлов в `/var/www/rythm-group` запуск и обновление одинаковые: `npm ci` → `npm run build` → PM2. Автодеплой через GitHub Actions здесь не используется.

Вариант с Docker и CI: [DEPLOY_VPS.md](./DEPLOY_VPS.md).

| Компонент                 | Роль                                                          |
| ------------------------- | ------------------------------------------------------------- |
| **Node.js 22**            | Сборка и запуск Next.js (`npm run build` / `npm start`)       |
| **PM2**                   | Процесс в фоне, автозапуск после перезагрузки сервера         |
| **nginx**                 | Reverse proxy, HTTPS (Let’s Encrypt)                          |
| **SQLite**                | Файл `./data/cms.db` (не удалять при обновлениях)             |
| **Yandex Object Storage** | Медиа CMS + опциональные бэкапы БД                            |

Канонический путь на сервере: `/var/www/rythm-group`.

Миграции БД выполняются при старте приложения (`getDb()` → `runMigrations()`). Отдельно `drizzle-kit push` на проде обычно не нужен.

Подготовку VPS можно сделать **скриптом** или **вручную** (разделы **1**–**5** ниже) — результат один и тот же.

### Быстрый старт (опционально): `scripts/vps-bootstrap-pm2.sh`

> **Где выполнять:** на **VPS** (Ubuntu), пользователь с `sudo`. Не на локальной Windows/macOS.  
> Docker-bootstrap: [scripts/vps-bootstrap.sh](./scripts/vps-bootstrap.sh) + [DEPLOY_VPS.md](./DEPLOY_VPS.md).

Скрипт ставит пакеты, **Node 22**, **PM2**, готовит `/var/www/rythm-group`, копирует `.env.example` → `.env` (без секретов), пишет базовый nginx → `:3000`.  
**Не** подставляет JWT/S3/Telegram и **не** выпускает HTTPS сам.

```bash
# Вариант 1: уже склонировали / скопировали репозиторий
cd /var/www/rythm-group
bash scripts/vps-bootstrap-pm2.sh

# Вариант 2: клон + bootstrap (публичный репо — HTTPS)
DEPLOY_USER=deploy \
REPO_URL=https://github.com/OWNER/REPO.git \
DOMAIN=omnigrps.ru \
bash -c 'curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/vps-bootstrap-pm2.sh | bash'

# Опционально сразу собрать и запустить (только после заполнения .env):
# START_APP=1 bash scripts/vps-bootstrap-pm2.sh
```

Дальше: заполнить `.env` → при необходимости `npm ci && npm run build` → `pm2 start` / `pm2 startup` → DNS → certbot (см. чеклист §9).  
Если предпочитаете контроль каждого шага — пропускайте скрипт и следуйте разделам **1**–**5**.

---

## 1. Подготовка VPS (Ubuntu)

Ручная установка (если не использовали `vps-bootstrap-pm2.sh`):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates nginx certbot python3-certbot-nginx rsync
```

### Node.js 22 (NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v22.x
npm -v
```

### PM2

```bash
sudo npm install -g pm2
pm2 -v
```

---

## 2. Первая доставка кода на VPS

Подготовьте каталог (общий шаг для обоих способов):

```bash
sudo mkdir -p /var/www/rythm-group
sudo chown "$USER:$USER" /var/www/rythm-group
```

### Вариант A — Git (публичный репозиторий)

```bash
cd /var/www/rythm-group

# Только HTTPS — для публичного репо ключ не нужен.
# URL вида git@github.com:... (SSH) без ключа на VPS даст Permission denied (publickey).
git clone https://github.com/webdiller/rythm-group.git .
mkdir -p data public/uploads
```

SSH-ключ к GitHub для публичного репо **не нужен** (клон только по HTTPS).

### Вариант B — копирование с локального ПК (без GitHub)

На **локальном** компьютере, из корня проекта (Git Bash / WSL / macOS / Linux). Подставьте пользователя и IP VPS:

```bash
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude data \
  --exclude .env \
  --exclude .env.local \
  --exclude .git \
  ./ USER@VPS_IP:/var/www/rythm-group/
```

Затем на VPS:

```bash
cd /var/www/rythm-group
mkdir -p data public/uploads
```

Не копируйте на сервер локальный `.env.local` и не затирайте уже существующие на VPS `.env` и `data/`.

Альтернатива без rsync: архив (`tar`/`zip`) + `scp`, затем распаковка в `/var/www/rythm-group` с теми же исключениями.

Дальше для **обоих** вариантов — разделы **3** и **4**.

---

## 3. Переменные окружения

```bash
cd /var/www/rythm-group
cp .env.example .env
nano .env
```

Обязательно заполните:

- `JWT_SECRET` — например `openssl rand -base64 32`
- `ADMIN_USERS` — `логин:пароль` (можно несколько через запятую)
- `DB_PATH` — обычно `./data/cms.db` (можно не менять)
- `NEXT_PUBLIC_SITE_URL` — `https://omnigrps.ru` (без `/` в конце)
- Telegram (заявки с форм): `SECRETS_ENCRYPTION_KEY` (обязателен для хранения токена в админке) + опционально `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` как fallback; либо задайте токен и chat id в админке
- Yandex Object Storage: `YA_STORAGE_ID`, `YA_STORAGE_SECRET`, `YA_BUCKET_NAME`, `YA_REGION`, `YA_ENDPOINT`, `NEXT_PUBLIC_YA_PUBLIC_BASE`

Опционально для бэкапов: `BACKUP_S3_PREFIX=backups/cms`, `BACKUP_KEEP_DAYS=14`.

На проде не включайте `ALLOW_DEMO_SEED=1` без необходимости (демо-сид и импорт `data.local.json`).

> Переменные `NEXT_PUBLIC_*` вшиваются в клиентский бандл на этапе **`npm run build`**. После смены домена или публичного URL бакета выполните rebuild и `pm2 reload` — одного `pm2 restart` недостаточно.

Файл `.env` не коммитьте и не перезаписывайте при rsync. Каталог `data/` тоже не должен попадать в git / в синхронизацию с ПК.

---

## 4. Схема БД, сборка и запуск через PM2

На этапе `next build` layout читает SQLite. Перед первой сборкой нужно создать таблицы:

```bash
cd /var/www/rythm-group
npm ci
npm run db:push
# опционально — стартовые настройки / демо-контент:
# npm run db:seed
npm run build
```

Если сборка уже упала с `no such table: site_settings`, достаточно `npm run db:push` и снова `npm run build` (свежий код также поднимает схему сам при пустой БД).

Запуск (в репозитории есть `ecosystem.config.cjs`):

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# выполните команду, которую выведет pm2 startup (с sudo)
```

Проверка:

```bash
pm2 status
pm2 logs rythm-group --lines 50
curl -I http://127.0.0.1:3000
```

База: `./data/cms.db` (создаётся `db:push` / первым обращением). Каталог `data/` не удаляйте.

Альтернатива без ecosystem-файла:

```bash
pm2 start npm --name rythm-group -- start
```

---

## 5. nginx + домен + HTTPS

Каталоги `/etc/nginx/sites-available` и `sites-enabled` появляются **только после установки пакета nginx** (команда из раздела **1**). Инструкция рассчитана на **Ubuntu/Debian**.

Если nano пишет `Directory '/etc/nginx/sites-available' does not exist`:

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
ls /etc/nginx/sites-available   # каталог должен существовать
```

1. В DNS создайте **A**-записи `@` и `www` на IP этого VPS.
2. Дождитесь резолва (`dig +short omnigrps.ru`).

Конфиг:

```bash
sudo nano /etc/nginx/sites-available/rythm-group
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name omnigrps.ru www.omnigrps.ru;

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

HTTPS:

```bash
sudo certbot --nginx -d omnigrps.ru -d www.omnigrps.ru
```

Certbot предложит редирект HTTP→HTTPS. При необходимости добавьте явный редирект `www` → apex отдельным `server`-блоком и снова `sudo nginx -t && sudo systemctl reload nginx`.

---

## 6. Обновление сайта (вручную)

После доставки новых файлов (git **или** rsync) на VPS всегда одно и то же:

```bash
cd /var/www/rythm-group

# Опционально: бэкап БД перед обновлением
node --env-file=.env scripts/backup-sqlite-to-s3.mjs || true

npm ci
npm run build
pm2 reload rythm-group
```

Не удаляйте `data/` и `.env` при обновлении.

Если меняли только серверный код без `NEXT_PUBLIC_*`, всё равно безопаснее делать полный `build` — так вы избежите рассинхрона артефактов.

### 6.1. Доставка кода через Git

На VPS после пуша в нужную ветку на GitHub:

```bash
cd /var/www/rythm-group
git pull
# далее npm ci / build / pm2 reload — как выше
```

### 6.2. Доставка кода с локального ПК (без GitHub)

С **локального** компьютера, из корня проекта:

```bash
rsync -avz \
  --exclude node_modules \
  --exclude .next \
  --exclude data \
  --exclude .env \
  --exclude .env.local \
  --exclude .git \
  ./ USER@VPS_IP:/var/www/rythm-group/
```

Затем на VPS: `npm ci` → `npm run build` → `pm2 reload rythm-group` (см. блок в начале раздела **6**).

Опционально `--delete` удалит на сервере файлы, которых уже нет локально. **Не используйте `--delete` без** `--exclude data` и `--exclude .env` — иначе можно снести БД или секреты.

### Совмещение Git и rsync

Оба способа допустимы. Если чередуете их на одном каталоге:

- после rsync `git status` на VPS может показывать «лишние» изменения;
- перед следующим `git pull` либо откатите локальные отличия на сервере, либо какое-то время обновляйтесь только через rsync.

Проще выбрать один основной канал доставки и придерживаться его.

---

## 7. Бэкапы SQLite → Object Storage

Разовый бэкап (из каталога проекта, с заполненным `.env`):

```bash
cd /var/www/rythm-group
node --env-file=.env scripts/backup-sqlite-to-s3.mjs
```

Cron (ежедневно в 03:15, поправьте TZ при необходимости):

```bash
crontab -e
```

```cron
15 3 * * * cd /var/www/rythm-group && /usr/bin/node --env-file=.env scripts/backup-sqlite-to-s3.mjs >> /var/log/rythm-db-backup.log 2>&1
```

---

## 8. Полезные команды

| Задача             | Команда                                              |
| ------------------ | ---------------------------------------------------- |
| Статус             | `pm2 status`                                         |
| Логи               | `pm2 logs rythm-group --lines 100`                   |
| Рестарт            | `pm2 restart rythm-group`                            |
| Reload (zero-ish)  | `pm2 reload rythm-group`                             |
| Остановка          | `pm2 stop rythm-group`                               |
| Обновление         | см. раздел **6** (git или rsync)                     |
| Восстановление БД  | положить файл в `./data/cms.db` → `pm2 restart …`    |

---

## 9. Чеклист первого запуска

- [ ] Подготовка VPS: `vps-bootstrap-pm2.sh` **или** ручные шаги §1
- [ ] Код в `/var/www/rythm-group` (git clone **или** rsync с ПК)
- [ ] `.env` заполнен, `data/` создан
- [ ] `npm ci && npm run build` прошли без ошибок
- [ ] `pm2 status` показывает `rythm-group` online, `pm2 save` + `pm2 startup` настроены
- [ ] `curl -I http://127.0.0.1:3000` отвечает
- [ ] DNS указывает на VPS, nginx + certbot настроены
- [ ] Сайт открывается по HTTPS, вход в админку работает

---

## Важно

1. **`./data`** — источник правды для контента CMS. Не удаляйте каталог «для чистоты» и не синхронизируйте его с ПК через rsync.
2. Смена `NEXT_PUBLIC_SITE_URL` или `NEXT_PUBLIC_YA_PUBLIC_BASE` → обязательный **`npm run build`** и `pm2 reload`.
3. При ошибке **413** увеличьте `client_max_body_size` в nginx.
4. На проде не включайте `ALLOW_DEMO_SEED=1` без необходимости (wipe CMS + медиа в S3).
