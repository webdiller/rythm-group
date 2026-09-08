/**
 * Одноразовая миграция: base64 channels.avatar → Yandex Object Storage, в БД остаётся S3 key.
 *
 *   npm run db:migrate-channel-avatars-s3
 *
 * На VPS с файлом `.env` (не `.env.local`):
 *   npx tsx --env-file=.env scripts/migrate-channel-avatars-to-s3.ts
 */
import { getDb } from "@/lib/db"
import { tableChannels } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  isChannelAvatarS3Key,
  isLegacyBase64ChannelAvatar,
  uploadChannelAvatarWebp,
} from "@/lib/s3/channel-avatar"
import { getYaStorageEnv } from "@/lib/s3/env"

async function main() {
  const env = getYaStorageEnv()
  console.log(
    `[migrate-channel-avatars] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`,
  )

  const db = getDb()
  const rows = db
    .select({ id: tableChannels.id, name: tableChannels.name, avatar: tableChannels.avatar })
    .from(tableChannels)
    .all()

  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const row of rows) {
    if (!row.avatar) {
      skipped += 1
      continue
    }
    if (isChannelAvatarS3Key(row.avatar)) {
      skipped += 1
      continue
    }
    if (!isLegacyBase64ChannelAvatar(row.avatar)) {
      console.warn(`[migrate-channel-avatars] skip id=${row.id}: unexpected avatar format`)
      skipped += 1
      continue
    }

    try {
      const buffer = Buffer.from(row.avatar, "base64")
      const key = await uploadChannelAvatarWebp(row.id, buffer)
      db.update(tableChannels)
        .set({ avatar: key })
        .where(eq(tableChannels.id, row.id))
        .run()
      migrated += 1
      console.log(`[migrate-channel-avatars] ok id=${row.id} name="${row.name}" → ${key}`)
    } catch (error) {
      failed += 1
      console.error(`[migrate-channel-avatars] FAIL id=${row.id} name="${row.name}"`, error)
    }
  }

  console.log(
    `[migrate-channel-avatars] done. migrated=${migrated} skipped=${skipped} failed=${failed} total=${rows.length}`,
  )
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error("[migrate-channel-avatars] fatal", error)
  process.exit(1)
})
