/**
 * Консистентный бэкап SQLite → Yandex Object Storage (приватный объект).
 *
 * Использование:
 *   node --env-file=.env scripts/backup-sqlite-to-s3.mjs
 *   docker compose exec app node scripts/backup-sqlite-to-s3.mjs
 *
 * Env (как у приложения) + опционально:
 *   BACKUP_S3_PREFIX=backups/cms   (без ведущего/хвостового /)
 *   BACKUP_KEEP_DAYS=14            (0 = не удалять старые)
 */
import { readFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"

const require = createRequire(import.meta.url)
const Database = require("better-sqlite3")

function requireEnv(name) {
	const v = process.env[name]?.trim()
	if (!v) throw new Error(`Missing env: ${name}`)
	return v
}

function stamp() {
	return new Date().toISOString().replace(/[:.]/g, "-")
}

async function main() {
	const dbPath = process.env.DB_PATH?.trim() || path.join(process.cwd(), "data", "cms.db")
	if (!existsSync(dbPath)) {
		throw new Error(`SQLite file not found: ${dbPath}`)
	}

	const accessKeyId = requireEnv("YA_STORAGE_ID")
	const secretAccessKey = requireEnv("YA_STORAGE_SECRET")
	const bucket = requireEnv("YA_BUCKET_NAME")
	const region = requireEnv("YA_REGION")
	const endpoint = requireEnv("YA_ENDPOINT")
	const prefix = (process.env.BACKUP_S3_PREFIX || "backups/cms").replace(/^\/+|\/+$/g, "")
	const keepDays = Number(process.env.BACKUP_KEEP_DAYS ?? "14")

	const id = stamp()
	const tmpDir = path.join(tmpdir(), "rythm-db-backup")
	mkdirSync(tmpDir, { recursive: true })
	const tmpFile = path.join(tmpDir, `cms-${id}.db`)

	console.log(`[backup] source=${dbPath}`)
	const src = new Database(dbPath, { readonly: true, fileMustExist: true })
	try {
		await src.backup(tmpFile)
	} finally {
		src.close()
	}

	const key = `${prefix}/cms-${id}.db`
	const client = new S3Client({
		region,
		endpoint,
		credentials: { accessKeyId, secretAccessKey },
		forcePathStyle: true,
	})

	console.log(`[backup] upload s3://${bucket}/${key}`)
	const body = readFileSync(tmpFile)
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: "application/x-sqlite3",
			ContentLength: body.length,
			// без ACL — объект приватный (бэкапы не должны быть public-read)
		}),
	)

	try {
		unlinkSync(tmpFile)
	} catch {
		/* ignore */
	}

	if (Number.isFinite(keepDays) && keepDays > 0) {
		await pruneOldBackups(client, bucket, prefix, keepDays)
	}

	console.log(`[backup] ok key=${key}`)
}

async function pruneOldBackups(client, bucket, prefix, keepDays) {
	const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000
	const toDelete = []
	let token

	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: `${prefix}/`,
				ContinuationToken: token,
			}),
		)
		for (const obj of page.Contents ?? []) {
			if (!obj.Key || !obj.LastModified) continue
			if (obj.LastModified.getTime() < cutoff) {
				toDelete.push({ Key: obj.Key })
			}
		}
		token = page.IsTruncated ? page.NextContinuationToken : undefined
	} while (token)

	if (toDelete.length === 0) {
		console.log(`[backup] prune: nothing older than ${keepDays}d`)
		return
	}

	for (let i = 0; i < toDelete.length; i += 1000) {
		const chunk = toDelete.slice(i, i + 1000)
		await client.send(
			new DeleteObjectsCommand({
				Bucket: bucket,
				Delete: { Objects: chunk, Quiet: true },
			}),
		)
	}
	console.log(`[backup] prune: deleted ${toDelete.length} object(s)`)
}

main().catch((err) => {
	console.error("[backup] failed:", err)
	process.exit(1)
})
