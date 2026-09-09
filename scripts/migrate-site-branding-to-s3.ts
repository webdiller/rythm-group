/**
 * Одноразовая миграция: base64 site_settings.logo / favicon → Yandex Object Storage.
 *
 *   npm run db:migrate-site-branding-s3
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/migrate-site-branding-to-s3.ts
 */
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isLegacyBase64SiteAsset, isSiteFaviconS3Key, isSiteLogoS3Key, uploadSiteFaviconPng, uploadSiteLogoWebp } from "@/lib/s3/site-assets"
import { getYaStorageEnv } from "@/lib/s3/env"

async function main() {
  const env = getYaStorageEnv()
  console.log(`[migrate-site-branding] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`)

  const db = getDb()
  const row = db.select().from(tableSiteSettings).limit(1).all()[0]

  if (!row) {
    console.log("[migrate-site-branding] no site_settings row — nothing to do")
    return
  }

  let migrated = 0
  let skipped = 0
  let failed = 0
  const patch: { logo?: string; favicon?: string } = {}

  if (!row.logo) {
    skipped += 1
    console.log("[migrate-site-branding] logo: empty — skip")
  } else if (isSiteLogoS3Key(row.logo)) {
    skipped += 1
    console.log("[migrate-site-branding] logo: already S3 key — skip")
  } else if (!isLegacyBase64SiteAsset(row.logo)) {
    skipped += 1
    console.warn("[migrate-site-branding] logo: unexpected format — skip")
  } else {
    try {
      const buffer = Buffer.from(row.logo, "base64")
      const key = await uploadSiteLogoWebp(buffer)
      patch.logo = key
      migrated += 1
      console.log(`[migrate-site-branding] logo ok → ${key}`)
    } catch (error) {
      failed += 1
      console.error("[migrate-site-branding] logo FAIL", error)
    }
  }

  if (!row.favicon) {
    skipped += 1
    console.log("[migrate-site-branding] favicon: empty — skip")
  } else if (isSiteFaviconS3Key(row.favicon)) {
    skipped += 1
    console.log("[migrate-site-branding] favicon: already S3 key — skip")
  } else if (!isLegacyBase64SiteAsset(row.favicon)) {
    skipped += 1
    console.warn("[migrate-site-branding] favicon: unexpected format — skip")
  } else {
    try {
      const buffer = Buffer.from(row.favicon, "base64")
      // Исторически favicon хранился как PNG base64
      const key = await uploadSiteFaviconPng(buffer)
      patch.favicon = key
      migrated += 1
      console.log(`[migrate-site-branding] favicon ok → ${key}`)
    } catch (error) {
      failed += 1
      console.error("[migrate-site-branding] favicon FAIL", error)
    }
  }

  if (Object.keys(patch).length > 0) {
    db.update(tableSiteSettings).set(patch).where(eq(tableSiteSettings.id, row.id)).run()
  }

  console.log(`[migrate-site-branding] done. migrated=${migrated} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error("[migrate-site-branding] fatal", error)
  process.exit(1)
})
