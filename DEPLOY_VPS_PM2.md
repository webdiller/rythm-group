# Развёртывание на VPS (Node.js + PM2 + nginx)

Упрощённый вариант для **публичного** репозитория: клон через HTTPS, ручные обновления через `git pull`. Автодеплой через GitHub Actions здесь не используется.

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

---

## 1. Подготовка VPS (Ubuntu)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ca-certificates nginx certbot python3-certbot-nginx
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

## 2. Клон публичного репозитория

Подставьте свой URL вместо `OWNER/REPO`.

```bash
sudo mkdir -p /var/www/rythm-group
sudo chown "$USER:$USER" /var/www/rythm-group
cd /var/www/rythm-group

# Только HTTPS — для публичного репо ключ не нужен.
# URL вида git@github.com:... (SSH) без ключа на VPS даст Permission denied (publickey).
git clone https://github.com/webdiller/rythm-group.git .
mkdir -p data public/uploads
```

SSH-ключ к GitHub для публичного репо **не нужен** (клон только по HTTPS).

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
- `NEXT_PUBLIC_SITE_URL` — `https://example.com` (без `/` в конце)
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Yandex Object Storage: `YA_STORAGE_ID`, `YA_STORAGE_SECRET`, `YA_BUCKET_NAME`, `YA_REGION`, `YA_ENDPOINT`, `NEXT_PUBLIC_YA_PUBLIC_BASE`

Опционально для бэкапов: `BACKUP_S3_PREFIX=backups/cms`, `BACKUP_KEEP_DAYS=14`.

> Переменные `NEXT_PUBLIC_*` вшиваются в клиентский бандл на этапе **`npm run build`**. После смены домена или публичного URL бакета выполните rebuild и `pm2 reload` — одного `pm2 restart` недостаточно.

Файл `.env` не коммитьте. Каталог `data/` тоже не должен попадать в git (уже в `.gitignore`).

---

## 4. Сборка и запуск через PM2

```bash
cd /var/www/rythm-group
npm ci
npm run build
```

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

База `./data/cms.db` появится после первого обращения к приложению.

Альтернатива без ecosystem-файла:

```bash
pm2 start npm --name rythm-group -- start
```

---

## 5. nginx + домен + HTTPS

1. В DNS создайте **A**-записи `@` и `www` на IP этого VPS.
2. Дождитесь резолва (`dig +short example.com`).

Конфиг:

```bash
sudo nano /etc/nginx/sites-available/rythm-group
```

```nginx
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

HTTPS:

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Certbot предложит редирект HTTP→HTTPS. При необходимости добавьте явный редирект `www` → apex отдельным `server`-блоком и снова `sudo nginx -t && sudo systemctl reload nginx`.

---

## 6. Обновление сайта (вручную)

На VPS после пуша в `main` (или нужную ветку) на GitHub:

```bash
cd /var/www/rythm-group

# Опционально: бэкап БД перед обновлением
node --env-file=.env scripts/backup-sqlite-to-s3.mjs || true

git pull
npm ci
npm run build
pm2 reload rythm-group
```

Не удаляйте `data/` и `.env` при обновлении.

Если меняли только серверный код без `NEXT_PUBLIC_*`, всё равно безопаснее делать полный `build` — так вы избежите рассинхрона артефактов.

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
| Обновление         | см. раздел **6**                                     |
| Восстановление БД  | положить файл в `./data/cms.db` → `pm2 restart …`    |

---

## 9. Чеклист первого запуска

- [ ] Node 22 и PM2 установлены
- [ ] Репозиторий склонирован в `/var/www/rythm-group`
- [ ] `.env` заполнен, `data/` создан
- [ ] `npm ci && npm run build` прошли без ошибок
- [ ] `pm2 status` показывает `rythm-group` online, `pm2 save` + `pm2 startup` настроены
- [ ] `curl -I http://127.0.0.1:3000` отвечает
- [ ] DNS указывает на VPS, nginx + certbot настроены
- [ ] Сайт открывается по HTTPS, вход в админку работает

---

## Важно

1. **`./data`** — источник правды для контента CMS. Не удаляйте каталог «для чистоты».
2. Смена `NEXT_PUBLIC_SITE_URL` или `NEXT_PUBLIC_YA_PUBLIC_BASE` → обязательный **`npm run build`** и `pm2 reload`.
3. При ошибке **413** увеличьте `client_max_body_size` в nginx.
4. На проде не включайте `ALLOW_DEMO_SEED=1` без необходимости (wipe CMS + медиа в S3).
