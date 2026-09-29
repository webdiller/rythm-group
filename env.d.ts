declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string
      DB_PATH: string
      ADMIN_USERS?: string
      /** Telegram Bot API token (optional fallback; prefer encrypted admin settings). */
      TELEGRAM_BOT_TOKEN?: string
      /** Destination chat id (optional fallback). */
      TELEGRAM_CHAT_ID?: string
      /** Master key for AES-GCM encryption of admin-stored secrets (any passphrase). */
      SECRETS_ENCRYPTION_KEY?: string
      NEXT_PUBLIC_SITE_URL?: string
      NEXT_PUBLIC_VERCEL_URL?: string
      YA_STORAGE_ID: string
      YA_STORAGE_SECRET: string
      YA_BUCKET_NAME: string
      YA_REGION: string
      YA_ENDPOINT: string
      /** Публичный префикс: https://storage.yandexcloud.net/{bucket} */
      NEXT_PUBLIC_YA_PUBLIC_BASE?: string
      ALLOW_DEMO_SEED?: string
      BACKUP_S3_PREFIX?: string
      BACKUP_KEEP_DAYS?: string
    }
  }
  interface Window {}
}

export {}
