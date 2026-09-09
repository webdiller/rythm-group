/**
 * Одноразовая миграция: `public/uploads/blog/**` → Yandex Object Storage.
 * Обложки `/uploads/blog/{file}` → ключ `blog/images/{file}` в `cover_image_url`.
 *
 *   npm run db:migrate-blog-uploads-s3
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/migrate-blog-uploads-to-s3.ts
 */
import { promises as fs } from "node:fs"
import path from "node:path"
import { getDb } from "@/lib/db"
import { tableBlogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getYaStorageEnv } from "@/lib/s3/env"
import { putPublicObject } from "@/lib/s3/objects"
import { BLOG_IMAGES_KEY_PREFIX, BLOG_VIDEOS_KEY_PREFIX, isBlogImageS3Key } from "@/lib/s3/blog-asset-url"
import { BLOG_UPLOAD_PUBLIC_PREFIX, isLocalBlogUploadUrl, isSafeBlogUploadFileName } from "@/lib/blog/local-upload-url"

function mimeForExt(ext: string): string {
	switch (ext.toLowerCase()) {
		case ".jpg":
		case ".jpeg":
			return "image/jpeg"
		case ".png":
			return "image/png"
		case ".webp":
			return "image/webp"
		case ".gif":
			return "image/gif"
		case ".mp4":
			return "video/mp4"
		case ".webm":
			return "video/webm"
		default:
			return "application/octet-stream"
	}
}

async function listFiles(dir: string): Promise<string[]> {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true })
		return entries.filter((e) => e.isFile()).map((e) => e.name)
	} catch (error: unknown) {
		const err = error as NodeJS.ErrnoException
		if (err.code === "ENOENT") return []
		throw error
	}
}

async function main() {
	const env = getYaStorageEnv()
	console.log(`[migrate-blog-uploads] bucket=${env.YA_BUCKET_NAME} region=${env.YA_REGION} endpoint=${env.YA_ENDPOINT}`)

	const imagesDir = path.join(process.cwd(), "public", "uploads", "blog")
	const videosDir = path.join(imagesDir, "videos")

	let uploaded = 0
	let skippedFiles = 0
	let failedFiles = 0

	const imageNames = await listFiles(imagesDir)
	for (const name of imageNames) {
		if (!isSafeBlogUploadFileName(name)) {
			skippedFiles += 1
			console.warn(`[migrate-blog-uploads] skip unsafe image name: ${name}`)
			continue
		}
		const key = `${BLOG_IMAGES_KEY_PREFIX}${name}`
		const abs = path.join(imagesDir, name)
		try {
			const body = await fs.readFile(abs)
			await putPublicObject({
				key,
				body,
				contentType: mimeForExt(path.extname(name)),
			})
			uploaded += 1
			console.log(`[migrate-blog-uploads] image ok → ${key}`)
		} catch (error) {
			failedFiles += 1
			console.error(`[migrate-blog-uploads] image FAIL ${name}`, error)
		}
	}

	const videoNames = await listFiles(videosDir)
	for (const name of videoNames) {
		if (!isSafeBlogUploadFileName(name)) {
			skippedFiles += 1
			console.warn(`[migrate-blog-uploads] skip unsafe video name: ${name}`)
			continue
		}
		const key = `${BLOG_VIDEOS_KEY_PREFIX}${name}`
		const abs = path.join(videosDir, name)
		try {
			const body = await fs.readFile(abs)
			await putPublicObject({
				key,
				body,
				contentType: mimeForExt(path.extname(name)),
			})
			uploaded += 1
			console.log(`[migrate-blog-uploads] video ok → ${key}`)
		} catch (error) {
			failedFiles += 1
			console.error(`[migrate-blog-uploads] video FAIL ${name}`, error)
		}
	}

	const db = getDb()
	const rows = db.select({ id: tableBlogPosts.id, cover_image_url: tableBlogPosts.cover_image_url }).from(tableBlogPosts).all()

	let coversMigrated = 0
	let coversSkipped = 0

	for (const row of rows) {
		const cover = row.cover_image_url?.trim() ?? ""
		if (!cover) {
			coversSkipped += 1
			continue
		}
		if (isBlogImageS3Key(cover)) {
			coversSkipped += 1
			continue
		}
		if (!isLocalBlogUploadUrl(cover)) {
			coversSkipped += 1
			continue
		}
		let pathname: string
		try {
			pathname = new URL(cover, "http://local.invalid").pathname
		} catch {
			coversSkipped += 1
			continue
		}
		const fileName = pathname.slice(BLOG_UPLOAD_PUBLIC_PREFIX.length)
		if (!isSafeBlogUploadFileName(fileName)) {
			coversSkipped += 1
			continue
		}
		const key = `${BLOG_IMAGES_KEY_PREFIX}${fileName}`
		db.update(tableBlogPosts).set({ cover_image_url: key }).where(eq(tableBlogPosts.id, row.id)).run()
		coversMigrated += 1
		console.log(`[migrate-blog-uploads] cover id=${row.id} → ${key}`)
	}

	console.log(`[migrate-blog-uploads] done. files uploaded=${uploaded} skipped=${skippedFiles} failed=${failedFiles}; covers migrated=${coversMigrated} skipped=${coversSkipped}`)
	if (failedFiles > 0) process.exitCode = 1
}

main().catch((error) => {
	console.error("[migrate-blog-uploads] fatal", error)
	process.exit(1)
})
