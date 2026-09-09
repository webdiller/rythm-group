/**
 * Одноразовая миграция: base64 about_cards.icon_image → Yandex Object Storage.
 *
 *   npm run db:migrate-about-icons-s3
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/migrate-about-icons-to-s3.ts
 */
import { getDb } from "@/lib/db"
import { tableAboutCards } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isAboutIconS3Key, isLegacyBase64AboutIcon, uploadAboutIconWebp } from "@/lib/s3/about-icon"
import { getYaStorageEnv } from "@/lib/s3/env"

async function main() {
  const env = getYaStorageEnv()
  console.log(`[migrate-about-icons] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`)

  const db = getDb()
  const rows = db
    .select({
      id: tableAboutCards.id,
      title_ru: tableAboutCards.title_ru,
      icon_image: tableAboutCards.icon_image,
    })
    .from(tableAboutCards)
    .all()

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    if (!row.icon_image) {
      skipped += 1
      continue
    }
    if (isAboutIconS3Key(row.icon_image)) {
      skipped += 1
      continue
    }
    if (!isLegacyBase64AboutIcon(row.icon_image)) {
      console.warn(`[migrate-about-icons] skip id=${row.id}: unexpected icon_image format`)
      skipped += 1
      continue
    }

    try {
      const buffer = Buffer.from(row.icon_image, "base64")
      const key = await uploadAboutIconWebp(row.id, buffer)
      db.update(tableAboutCards).set({ icon_image: key }).where(eq(tableAboutCards.id, row.id)).run()
      migrated += 1
      console.log(`[migrate-about-icons] ok id=${row.id} title="${row.title_ru}" → ${key}`)
    } catch (error) {
      failed += 1
      console.error(`[migrate-about-icons] FAIL id=${row.id} title="${row.title_ru}"`, error)
    }
  }

  console.log(`[migrate-about-icons] done. migrated=${migrated} skipped=${skipped} failed=${failed} total=${rows.length}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error("[migrate-about-icons] fatal", error)
  process.exit(1)
})
