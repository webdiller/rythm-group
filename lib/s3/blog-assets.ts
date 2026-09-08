import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { getYaStorageEnv } from "@/lib/s3/env"
import { getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"
import {
  BLOG_IMAGES_KEY_PREFIX,
  BLOG_VIDEOS_KEY_PREFIX,
  isBlogImageS3Key,
  isBlogS3Key,
  isBlogVideoS3Key,
  tryExtractBlogKeyFromPublicUrl,
} from "@/lib/s3/blog-asset-url"
import {
  deleteBlogUploadFileByPublicUrl,
  deleteBlogVideoFileByPublicUrl,
} from "@/lib/blog-local-upload"
import { isLocalBlogUploadUrl, isLocalBlogVideoUploadUrl } from "@/lib/blog/local-upload-url"

export {
  BLOG_IMAGES_KEY_PREFIX,
  BLOG_VIDEOS_KEY_PREFIX,
  getBlogCoverSrc,
  isBlogImageS3Key,
  isBlogS3Key,
  isBlogVideoS3Key,
  isManagedBlogImageRef,
  isManagedBlogVideoRef,
} from "@/lib/s3/blog-asset-url"

function imageExtForMime(mime: string): string {
  if (mime === "image/jpeg") return ".jpg"
  if (mime === "image/png") return ".png"
  if (mime === "image/webp") return ".webp"
  if (mime === "image/gif") return ".gif"
  return ".bin"
}

function videoExtForMime(mime: string): string {
  if (mime === "video/webm") return ".webm"
  return ".mp4"
}

export function buildBlogImageKey(mime: string): string {
  const ext = imageExtForMime(mime)
  return `${BLOG_IMAGES_KEY_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
}

export function buildBlogVideoKey(mime: string): string {
  const ext = videoExtForMime(mime)
  return `${BLOG_VIDEOS_KEY_PREFIX}${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
}

export async function uploadBlogImage(
  buf: Buffer,
  mime: string,
): Promise<{ key: string; url: string }> {
  const key = buildBlogImageKey(mime)
  await putPublicObject({ key, body: buf, contentType: mime })
  return { key, url: getPublicObjectUrl(key) }
}

export async function uploadBlogVideo(
  buf: Buffer,
  mime: string,
): Promise<{ key: string; url: string }> {
  const key = buildBlogVideoKey(mime)
  await putPublicObject({ key, body: buf, contentType: mime })
  return { key, url: getPublicObjectUrl(key) }
}

/** Публичный URL для ключа (server). */
export function resolveBlogAssetPublicUrl(key: string): string {
  return getPublicObjectUrl(key.trim())
}

/**
 * Обложка для SSR/OG: key → absolute S3 URL; иначе исходное значение.
 */
export function resolveBlogCoverDisplayUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null
  if (isBlogS3Key(raw)) return getPublicObjectUrl(raw)
  return raw
}

/** Достаёт blog S3 key из публичного URL (любой known public base). */
export function extractBlogKeyFromUrl(url: string): string | null {
  const fromClientBase = tryExtractBlogKeyFromPublicUrl(url)
  if (fromClientBase) return fromClientBase

  try {
    const { YA_ENDPOINT, YA_BUCKET_NAME } = getYaStorageEnv()
    const base = getPublicObjectUrlFromBase(
      `${YA_ENDPOINT.replace(/\/$/, "")}/${YA_BUCKET_NAME}`,
      "",
    ).replace(/\/$/, "")
    const trimmed = url.trim()
    const prefix = `${base}/`
    if (!trimmed.startsWith(prefix)) return null
    const key = (trimmed.slice(prefix.length).split("?")[0] ?? "").trim()
    return isBlogS3Key(key) ? key : null
  } catch {
    return null
  }
}

/**
 * Удаляет медиа блога: локальный файл и/или объект S3 (по key или public URL).
 */
export async function deleteBlogAssetByRef(value: string | null | undefined): Promise<void> {
  if (!value) return
  const trimmed = value.trim()
  if (!trimmed) return

  if (isBlogS3Key(trimmed)) {
    await deleteObjectByKey(trimmed)
    return
  }

  const fromUrl = extractBlogKeyFromUrl(trimmed)
  if (fromUrl) {
    await deleteObjectByKey(fromUrl)
    return
  }

  await deleteBlogUploadFileByPublicUrl(trimmed)
  await deleteBlogVideoFileByPublicUrl(trimmed)
}

export function isManagedBlogAssetRef(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isBlogS3Key(v)) return true
  if (extractBlogKeyFromUrl(v)) return true
  if (isLocalBlogUploadUrl(v)) return true
  if (isLocalBlogVideoUploadUrl(v)) return true
  return false
}
