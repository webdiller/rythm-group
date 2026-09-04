declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string
      DB_PATH: string
      ADMIN_USERS?: string
      SMTP_HOST: string
      SMTP_PORT: number
      SMTP_USER: string
      SMTP_PASS: string
      SMTP_FROM?: string
      CONTACT_FALLBACK_EMAIL?: string
      CONTACT_EMAIL_SUBJECT?: string
      SEQUENZY_API_KEY?: string
      NEXT_PUBLIC_SITE_URL?: string
      NEXT_PUBLIC_VERCEL_URL?: string
      S3_ENDPOINT?: string
      S3_REGION?: string
      S3_BUCKET?: string
      S3_ACCESS_KEY_ID?: string
      S3_SECRET_ACCESS_KEY?: string
      S3_PUBLIC_URL_PREFIX?: string
    }
  }
  interface Window {
  }
}

export {}