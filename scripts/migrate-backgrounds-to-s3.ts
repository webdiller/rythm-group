/**
 * Одноразовая миграция: файлы `public/backgrounds/*.webp` → Yandex Object Storage,
 * ключи пишутся в `site_settings.backgrounds` (JSON).
 *
 *   npm run db:migrate-backgrounds-s3
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/migrate-backgrounds-to-s3.ts
 */
import { promises as fs } from "node:fs"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getYaStorageEnv } from "@/lib/s3/env"
import { BACKGROUND_SLOTS, backgroundSlotToFilename, isBackgroundS3Key, parseBackgroundsJson, serializeBackgroundsMap, type BackgroundsMap, uploadBackgroundWebp } from "@/lib/s3/backgrounds"
import { legacyBackgroundDiskPath } from "@/lib/server/site-backgrounds"

async function main() {
  const env = getYaStorageEnv()
  console.log(`[migrate-backgrounds] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`)

  const db = getDb()
  let row = db.select().from(tableSiteSettings).limit(1).all()[0]

  if (!row) {
    db.insert(tableSiteSettings).values({ backgrounds: "{}" }).run()
    row = db.select().from(tableSiteSettings).limit(1).all()[0]
  }

  if (!row) {
    console.error("[migrate-backgrounds] failed to ensure site_settings row")
    process.exit(1)
  }

  const map: BackgroundsMap = parseBackgroundsJson(row.backgrounds)
  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const slot of BACKGROUND_SLOTS) {
    const existing = map[slot]
    if (existing && isBackgroundS3Key(existing)) {
      skipped += 1
      console.log(`[migrate-backgrounds] ${slot}: already S3 key — skip`)
      continue
    }

    const diskPath = legacyBackgroundDiskPath(slot)
    let buffer: Buffer
    try {
      buffer = await fs.readFile(diskPath)
    } catch {
      skipped += 1
      console.log(`[migrate-backgrounds] ${slot}: no file ${backgroundSlotToFilename(slot)} — skip`)
      continue
    }

    try {
      const key = await uploadBackgroundWebp(slot, buffer)
      map[slot] = key
      migrated += 1
      console.log(`[migrate-backgrounds] ${slot} ok → ${key}`)
    } catch (error) {
      failed += 1
      console.error(`[migrate-backgrounds] ${slot} FAIL`, error)
    }
  }

  db.update(tableSiteSettings)
    .set({ backgrounds: serializeBackgroundsMap(map) })
    .where(eq(tableSiteSettings.id, row.id))
    .run()

  console.log(`[migrate-backgrounds] done. migrated=${migrated} skipped=${skipped} failed=${failed}`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error("[migrate-backgrounds] fatal", error)
  process.exit(1)
})
