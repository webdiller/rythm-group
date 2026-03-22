import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const MAX_BYTES = 10 * 1024 * 1024

export const ALLOWED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])

export type S3Ready =
  | {
      ok: true
      client: S3Client
      bucket: string
      /** Без завершающего слэша; к нему добавляется / + key */
      publicUrlPrefix: string
    }
  | { ok: false }

export function getBlogUploadS3Config(): S3Ready {
  const endpoint = process.env.S3_ENDPOINT
  const region = process.env.S3_REGION ?? "ru-central1"
  const bucket = process.env.S3_BUCKET
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  const publicUrlPrefix = (process.env.S3_PUBLIC_URL_PREFIX ?? "").replace(/\/$/, "")
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicUrlPrefix) {
    return { ok: false }
  }
  const client = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  })
  return { ok: true, client, bucket, publicUrlPrefix }
}

export function assertUploadSizeAndMime(size: number, mime: string) {
  if (size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE")
  }
  if (!ALLOWED_UPLOAD_MIMES.has(mime)) {
    throw new Error("MIME_NOT_ALLOWED")
  }
}

export async function putBlogImageToS3(
  buf: Buffer,
  mime: string,
  originalName: string
): Promise<string> {
  const cfg = getBlogUploadS3Config()
  if (!cfg.ok) {
    throw new Error("S3_NOT_CONFIGURED")
  }
  const ext =
    mime === "image/jpeg"
      ? ".jpg"
      : mime === "image/png"
        ? ".png"
        : mime === "image/webp"
          ? ".webp"
          : ".gif"
  const safeBase = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "upload"
  const key = `blog/${Date.now()}-${safeBase}${ext}`
  await cfg.client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buf,
      ContentType: mime,
    })
  )
  return `${cfg.publicUrlPrefix}/${key}`
}
