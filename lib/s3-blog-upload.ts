import { getS3Bucket, getS3Client } from "@/lib/s3/client"
import { getYaStorageEnv } from "@/lib/s3/env"

const MAX_BYTES = 10 * 1024 * 1024

export const ALLOWED_UPLOAD_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

export type S3Ready =
	| {
			ok: true
			client: ReturnType<typeof getS3Client>
			bucket: string
			/** Без завершающего слэша; к нему добавляется / + key */
			publicUrlPrefix: string
	  }
	| { ok: false }

/** @deprecated Используйте getS3Client / getYaStorageEnv. Оставлено для совместимости. */
export function getBlogUploadS3Config(): S3Ready {
	try {
		const env = getYaStorageEnv()
		const client = getS3Client()
		const bucket = getS3Bucket()
		const publicUrlPrefix = `${env.YA_ENDPOINT.replace(/\/$/, "")}/${bucket}`
		return { ok: true, client, bucket, publicUrlPrefix }
	} catch {
		return { ok: false }
	}
}

export function assertUploadSizeAndMime(size: number, mime: string) {
	if (size > MAX_BYTES) {
		throw new Error("FILE_TOO_LARGE")
	}
	if (!ALLOWED_UPLOAD_MIMES.has(mime)) {
		throw new Error("MIME_NOT_ALLOWED")
	}
}
