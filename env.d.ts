declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string
      DB_PATH: string
      ADMIN_USERS?: string
      /** Telegram Bot API token (from @BotFather). Required for contact form. */
      TELEGRAM_BOT_TOKEN?: string
      /** Destination chat/group/channel id for contact notifications. */
      TELEGRAM_CHAT_ID?: string
      SMTP_HOST?: string
      SMTP_PORT?: number
      SMTP_USER?: string
      SMTP_PASS?: string
      SMTP_FROM?: string
      CONTACT_FALLBACK_EMAIL?: string
      CONTACT_EMAIL_SUBJECT?: string
      SEQUENZY_API_KEY?: string
      NEXT_PUBLIC_SITE_URL?: string
      NEXT_PUBLIC_VERCEL_URL?: string
      YA_STORAGE_ID: string
      YA_STORAGE_SECRET: string
      YA_BUCKET_NAME: string
      YA_REGION: string
      YA_ENDPOINT: string
      /** Публичный префикс: https://storage.yandexcloud.net/{bucket} */
      NEXT_PUBLIC_YA_PUBLIC_BASE?: string
    }
  }
  interface Window {}
}

export {}
