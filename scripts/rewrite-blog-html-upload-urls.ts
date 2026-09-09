/**
 * Одноразовая миграция: в HTML постов заменить `/uploads/blog/...` на публичные S3 URL.
 * Запускать после `db:migrate-blog-uploads-s3` (файлы уже в бакете с теми же именами).
 *
 *   npm run db:rewrite-blog-html-s3-urls
 *
 * На VPS с `.env`:
 *   npx tsx --env-file=.env scripts/rewrite-blog-html-upload-urls.ts
 */
import { getDb } from "@/lib/db"
import { tableBlogPosts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getYaStorageEnv } from "@/lib/s3/env"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { BLOG_IMAGES_KEY_PREFIX, BLOG_VIDEOS_KEY_PREFIX } from "@/lib/s3/blog-asset-url"
import { isSafeBlogUploadFileName } from "@/lib/blog/local-upload-url"

const LOCAL_VIDEO_RE = /\/uploads\/blog\/videos\/([\w.-]+)/g
const LOCAL_IMAGE_RE = /\/uploads\/blog\/(?!videos\/)([\w.-]+)/g

function rewriteHtml(html: string): { next: string; replacements: number } {
	let replacements = 0
	let next = html.replace(LOCAL_VIDEO_RE, (_match, fileName: string) => {
		if (!isSafeBlogUploadFileName(fileName)) return _match
		replacements += 1
		return getPublicObjectUrl(`${BLOG_VIDEOS_KEY_PREFIX}${fileName}`)
	})
	next = next.replace(LOCAL_IMAGE_RE, (_match, fileName: string) => {
		if (!isSafeBlogUploadFileName(fileName)) return _match
		replacements += 1
		return getPublicObjectUrl(`${BLOG_IMAGES_KEY_PREFIX}${fileName}`)
	})
	return { next, replacements }
}

async function main() {
	const env = getYaStorageEnv()
	console.log(`[rewrite-blog-html] bucket=${env.YA_BUCKET_NAME} public via ${env.YA_ENDPOINT}/${env.YA_BUCKET_NAME}`)

	const db = getDb()
	const rows = db
		.select({
			id: tableBlogPosts.id,
			body_html_ru: tableBlogPosts.body_html_ru,
			body_html_en: tableBlogPosts.body_html_en,
		})
		.from(tableBlogPosts)
		.all()

	let postsTouched = 0
	let totalReplacements = 0

	for (const row of rows) {
		const ru = rewriteHtml(row.body_html_ru ?? "")
		const en = rewriteHtml(row.body_html_en ?? "")
		const replacements = ru.replacements + en.replacements
		if (replacements === 0) continue

		db.update(tableBlogPosts)
			.set({
				body_html_ru: ru.next,
				body_html_en: en.next,
			})
			.where(eq(tableBlogPosts.id, row.id))
			.run()

		postsTouched += 1
		totalReplacements += replacements
		console.log(`[rewrite-blog-html] post id=${row.id} replacements=${replacements}`)
	}

	console.log(`[rewrite-blog-html] done. posts=${postsTouched} replacements=${totalReplacements} scanned=${rows.length}`)
}

main().catch((error) => {
	console.error("[rewrite-blog-html] fatal", error)
	process.exit(1)
})
