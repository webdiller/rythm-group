import { DeleteObjectCommand, PutObjectCommand, type ObjectCannedACL } from "@aws-sdk/client-s3"
import { getS3Bucket, getS3Client } from "@/lib/s3/client"

const PUBLIC_READ_ACL = "public-read" as ObjectCannedACL

export type PutPublicObjectInput = {
	key: string
	body: Buffer
	contentType: string
	/** Уникальные ключи → долгий immutable cache */
	cacheControl?: string
}

export async function putPublicObject(input: PutPublicObjectInput): Promise<void> {
	const client = getS3Client()
	const bucket = getS3Bucket()
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: input.key,
			Body: input.body,
			ContentType: input.contentType,
			ACL: PUBLIC_READ_ACL,
			CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
		}),
	)
}

/** Идемпотентно: отсутствие объекта не считается ошибкой. */
export async function deleteObjectByKey(key: string): Promise<void> {
	const trimmed = key.trim()
	if (!trimmed) return
	const client = getS3Client()
	const bucket = getS3Bucket()
	try {
		await client.send(
			new DeleteObjectCommand({
				Bucket: bucket,
				Key: trimmed,
			}),
		)
	} catch (error: unknown) {
		const name = error && typeof error === "object" && "name" in error ? String((error as { name: unknown }).name) : ""
		if (name === "NoSuchKey" || name === "NotFound") return
		throw error
	}
}
