import Database from "better-sqlite3"
import path from "node:path"
import { ListObjectsV2Command } from "@aws-sdk/client-s3"
import { getDb } from "@/lib/db"
import { getS3Bucket, getS3Client } from "@/lib/s3/client"
import { getYaStorageEnv } from "@/lib/s3/env"
import { isDemoSeedAllowed } from "@/lib/demo-seed/guard"
import type { IntegrityCheck } from "@/lib/demo-seed/types"

const REQUIRED_TABLES = [
  "translations",
  "channel_categories",
  "channels",
  "partner_categories",
  "partners",
  "contacts",
  "contact_icons",
  "site_settings",
  "affiliate_hero",
  "affiliate_formats",
  "affiliate_faq",
  "about_cards",
  "affiliate_partner_views",
  "blog_categories",
  "blog_posts",
] as const

export async function runIntegrityChecks(): Promise<IntegrityCheck[]> {
  const checks: IntegrityCheck[] = []

  checks.push({
    id: "allow_flag",
    ok: isDemoSeedAllowed(),
    message: isDemoSeedAllowed()
      ? "ALLOW_DEMO_SEED включён"
      : "ALLOW_DEMO_SEED не задан (нужно 1/true в .env)",
  })

  const jwt = Boolean(process.env.JWT_SECRET?.trim() && process.env.JWT_SECRET !== "JWT_SECRET")
  checks.push({
    id: "jwt_secret",
    ok: jwt,
    message: jwt ? "JWT_SECRET задан" : "JWT_SECRET отсутствует или плейсхолдер",
  })

  const siteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim())
  checks.push({
    id: "site_url",
    ok: siteUrl,
    message: siteUrl ? "NEXT_PUBLIC_SITE_URL задан" : "NEXT_PUBLIC_SITE_URL пуст",
  })

  try {
    getDb()
    checks.push({
      id: "database",
      ok: true,
      message: "SQLite открывается, getDb() работает",
    })

    const dbPath = process.env.DB_PATH?.trim() || path.join(process.cwd(), "data", "cms.db")
    const raw = new Database(dbPath, { readonly: true, fileMustExist: true })
    try {
      const names = new Set(
        (
          raw.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{
            name: string
          }>
        ).map((r) => r.name),
      )
      const missing = REQUIRED_TABLES.filter((t) => !names.has(t))
      checks.push({
        id: "schema_tables",
        ok: missing.length === 0,
        message:
          missing.length === 0
            ? "Все ожидаемые таблицы на месте"
            : `Нет таблиц: ${missing.join(", ")} (перезапустите приложение для миграций)`,
      })
    } finally {
      raw.close()
    }
  } catch (e) {
    checks.push({
      id: "database",
      ok: false,
      message: `БД недоступна: ${e instanceof Error ? e.message : String(e)}`,
    })
    checks.push({
      id: "schema_tables",
      ok: false,
      message: "Схема не проверена (БД недоступна)",
    })
  }

  let yaOk = false
  try {
    getYaStorageEnv()
    yaOk = true
    checks.push({ id: "ya_env", ok: true, message: "Yandex Object Storage env валиден" })
  } catch (e) {
    checks.push({
      id: "ya_env",
      ok: false,
      message: `YA_* env: ${e instanceof Error ? e.message : String(e)}`,
    })
  }

  const publicBase = Boolean(process.env.NEXT_PUBLIC_YA_PUBLIC_BASE?.trim())
  checks.push({
    id: "ya_public_base",
    ok: publicBase,
    message: publicBase ? "NEXT_PUBLIC_YA_PUBLIC_BASE задан" : "NEXT_PUBLIC_YA_PUBLIC_BASE пуст",
  })

  if (yaOk) {
    try {
      const client = getS3Client()
      const bucket = getS3Bucket()
      await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          MaxKeys: 1,
        }),
      )
      checks.push({ id: "s3_access", ok: true, message: `S3 bucket «${bucket}» доступен` })
    } catch (e) {
      checks.push({
        id: "s3_access",
        ok: false,
        message: `S3 list failed: ${e instanceof Error ? e.message : String(e)}`,
      })
    }
  } else {
    checks.push({
      id: "s3_access",
      ok: false,
      message: "S3 не проверялся (нет валидного YA_* env)",
    })
  }

  return checks
}

export function integrityAllOk(checks: IntegrityCheck[]): boolean {
  return checks.every((c) => c.ok)
}
