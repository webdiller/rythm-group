## Развертывание проекта на VPS (Ubuntu + nginx + PM2)

### 1. Требования к серверу

- **OS**: Ubuntu  (рекомендовано 22.04+)
- **Rесурсы**: от 1 vCPU, 1–2 ГБ RAM
- **Доступ**: SSH-доступ под пользователем с `sudo`

На сервере будем использовать:

- **Node.js** (LTS/текущая 22+)
- **PM2** для управления процессом
- **nginx** в роли reverse proxy
- **SQLite** (через `better-sqlite3`, путь задаётся в `.env`)

---

### 2. Первичная настройка VPS

```bash
sudo apt update && sudo apt upgrade -y

# Базовые пакеты
sudo apt install -y git build-essential nginx nano unzip
```

#### Установка Node.js (через nvm)

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
```

Проверьте:

```bash
node -v
npm -v
```

#### Установка PM2

```bash
npm install -g pm2
```

---

### 3. Клонирование проекта

Рекомендуемая директория:

```bash
sudo mkdir -p /var/www/rythm-group
sudo chown $USER:$USER /var/www/rythm-group
cd /var/www/rythm-group
```

#### Настройка SSH для GitHub

Чтобы клонировать и обновлять репозиторий по SSH (`git@github.com:...`), на VPS нужен ключ и привязка к аккаунту GitHub.

1. **Создайте ключ** (если на сервере ещё нет подходящего):

   ```bash
   ssh-keygen -t ed25519 -C "ваш_email@example.com" -f ~/.ssh/id_ed25519
   ```

   На вопросы можно нажать Enter (пустая passphrase допустима на выделенном сервере; с passphrase безопаснее, но `git pull` будет запрашивать её, если не использовать ssh-agent).

2. **Запустите агент и добавьте ключ** (для текущей сессии; после перезагрузки при необходимости повторите `eval` и `ssh-add`):

   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Добавьте публичный ключ в GitHub**: скопируйте содержимое `~/.ssh/id_ed25519.pub` и в GitHub откройте **Settings → SSH and GPG keys → New SSH key**, вставьте ключ и сохраните.

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Проверьте соединение**:

   ```bash
   ssh -T git@github.com
   ```

   Ожидается сообщение вроде `Hi <username>! You've successfully authenticated...`.

5. **Клонируйте репозиторий** в текущую директорию (URL берите на GitHub: **Code → SSH** или **HTTPS**):

   ```bash
   # SSH (после настройки ключей выше)
   git clone git@github.com:OWNER/REPO.git .

   # или HTTPS (без SSH-ключа; для приватного репо — [Personal Access Token](https://github.com/settings/tokens) вместо пароля)
   # git clone https://github.com/OWNER/REPO.git .
   ```

Установите зависимости:

```bash
npm install
# или при строгом CI
# npm ci
```

---

### 4. Переменные окружения и база данных

Создайте файл `.env` в корне проекта (ориентируясь на `.env.example`):

```env
# Секрет для подписи JWT-токенов авторизации дашборда
# Сгенерируйте случайную строку: openssl rand -base64 32
JWT_SECRET=замените-на-случайную-строку-минимум-32-символа

# Путь к SQLite-базе данных
# Оставьте как есть — папка data/ создастся автоматически
DB_PATH=./data/cms.db

# Логин и пароль для первого входа в /dashboard
# Формат: логин:пароль (можно несколько через запятую: admin:pass1,editor:pass2)
ADMIN_USERS=admin:ваш-пароль

# SMTP для отправки заявок с контактной формы
SMTP_HOST=smtp.yandex.ru        # или smtp.gmail.com и т.д.
SMTP_PORT=465                    # 465 для SSL, 587 для TLS
SMTP_USER=ваш@email.ru
SMTP_PASS=пароль-приложения
SMTP_FROM=ваш@email.ru

# Публичный URL сайта — ОБЯЗАТЕЛЬНО для production
# Используется для серверных fetch к собственным API
# Укажите ваш домен или IP с портом
NEXT_PUBLIC_SITE_URL=https://ваш-домен.ru
```

Создайте директорию под SQLite, если используете путь по умолчанию:

```bash
mkdir -p data
```

При необходимости создайте/обновите структуру БД и данные (если предусмотрено в проекте):

```bash
npm run db:push   # применить миграции Drizzle
npm run db:seed   # начальные данные (опционально)
```

---

### 5. Сборка и запуск приложения

#### Production-сборка

```bash
npm run build
```

#### Запуск через PM2

Запустим Next.js на порту `3000`:

```bash
pm2 start npm --name "rythm-group" -- start -- -p 3000
```

Проверьте статус:

```bash
pm2 status
pm2 logs rythm-group
```

Настройте автозапуск PM2 после перезагрузки сервера:

```bash
pm2 startup systemd
# выполните команду, которую выведет предыдущая строка (с sudo)
pm2 save
```

---

### 6. Настройка nginx как reverse proxy

Создайте конфиг для сайта:

```bash
sudo nano /etc/nginx/sites-available/rythm-group
```

Пример минимальной конфигурации (HTTP):

```nginx
server {
    listen 80;
    server_name file-lab.ru www.file-lab.ru; # замените на свой домен или IP

    # По умолчанию nginx режет тела запросов (~1 MB) → 413 при загрузке изображений в админке.
    # API блога принимает до 10 MB; запас по размеру не помешает.
    client_max_body_size 20M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Активируйте конфиг и перезапустите nginx:

```bash
sudo ln -s /etc/nginx/sites-available/rythm-group /etc/nginx/sites-enabled/rythm-group
sudo nginx -t
sudo systemctl reload nginx
```

---

### 7. HTTPS (Let’s Encrypt, опционально, рекомендовано)

Установите certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Запустите получение сертификата:

```bash
sudo certbot --nginx -d file-lab.ru -d www.file-lab.ru
```

Certbot автоматически пропишет HTTPS-конфиг и настроит автообновление сертификата.

---

### 8. Обновление приложения (release-цикл)

При выкатывании новой версии:

```bash
cd /var/www/rythm-group
git pull
npm install         # или npm ci
npm run build
pm2 restart rythm-group
```

При необходимости – примените миграции:

```bash
npm run db:push
```

---

### 9. Быстрая проверка

- Приложение отвечает по `http://example.com` или по IP
- `pm2 status` показывает процесс `rythm-group` в состоянии `online`
- Логи без критичных ошибок:

```bash
pm2 logs rythm-group
sudo journalctl -u nginx -n 100 --no-pager
```

При ошибках проверьте:

- корректность `.env` (особенно `JWT_SECRET`, `DB_PATH`, SMTP и `NEXT_PUBLIC_SITE_URL`)
- права на директорию проекта и `data/`
- что порт 3000 не занят другим процессом
- **413 Request Entity Too Large** при загрузке файлов: в `server { }` для сайта нужен `client_max_body_size` (см. раздел 6); при необходимости увеличьте значение и выполните `sudo nginx -t && sudo systemctl reload nginx`
- **404 у превью `/uploads/blog/...` после загрузки**: в проекте обложки отдаются через маршрут `app/uploads/blog/[name]` (чтение с диска); после обновления кода выполните `npm run build` и `pm2 restart`. При желании можно отдавать каталог напрямую из nginx: `location /uploads/ { alias /var/www/rythm-group/public/uploads/; }`

