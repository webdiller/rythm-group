/**
 * Одноразовая миграция: base64 logo_url → Yandex Object Storage, в БД остаётся S3 key.
 *
 * Локально (Next.js env в `.env.local`):
 *   npm run db:migrate-logos-s3
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/migrate-partner-logos-to-s3.ts
 */
import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { isLegacyBase64Logo, isPartnerLogoS3Key, uploadPartnerLogoWebp } from "@/lib/s3/partner-logo"
import { getYaStorageEnv } from "@/lib/s3/env"

async function main() {
	// Проверка env до работы с БД
	const env = getYaStorageEnv()
	console.log(`[migrate-logos] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`)

	const db = getDb()
	const rows = db.select({ id: tablePartners.id, name: tablePartners.name, logo_url: tablePartners.logo_url }).from(tablePartners).all()

	let migrated = 0
	let skipped = 0
	let failed = 0

	for (const row of rows) {
		if (!row.logo_url) {
			skipped += 1
			continue
		}
		if (isPartnerLogoS3Key(row.logo_url)) {
			skipped += 1
			continue
		}
		if (!isLegacyBase64Logo(row.logo_url)) {
			console.warn(`[migrate-logos] skip partner id=${row.id}: unexpected logo_url format`)
			skipped += 1
			continue
		}

		try {
			const buffer = Buffer.from(row.logo_url, "base64")
			const key = await uploadPartnerLogoWebp(row.id, buffer)
			db.update(tablePartners).set({ logo_url: key }).where(eq(tablePartners.id, row.id)).run()
			migrated += 1
			console.log(`[migrate-logos] ok id=${row.id} name="${row.name}" → ${key}`)
		} catch (error) {
			failed += 1
			console.error(`[migrate-logos] FAIL id=${row.id} name="${row.name}"`, error)
		}
	}

	console.log(`[migrate-logos] done. migrated=${migrated} skipped=${skipped} failed=${failed} total=${rows.length}`)
	if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
	console.error("[migrate-logos] fatal", error)
	process.exit(1)
})
