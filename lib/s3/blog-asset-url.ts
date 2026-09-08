/**
 * Client-safe: ключи и URL медиа блога в S3.
 * (file rewritten via site-asset helpers batch — keep blog as-is)
 */
import {
  getNextPublicYaPublicBase,
  getPublicObjectUrlFromBase,
} from "@/lib/s3/public-url.shared"
import {
  BLOG_UPLOAD_PUBLIC_PREFIX,
  BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX,
  isLocalBlogUploadUrl,
  isLocalBlogVideoUploadUrl,
} from "@/lib/blog/local-upload-url"

export const BLOG_IMAGES_KEY_PREFIX = "blog/images/"
export const BLOG_VIDEOS_KEY_PREFIX = "blog/videos/"

export function isBlogImageS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(BLOG_IMAGES_KEY_PREFIX) && v.length < 1024 && !v.includes("..")
}

export function isBlogVideoS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(BLOG_VIDEOS_KEY_PREFIX) && v.length < 1024 && !v.includes("..")
}

export function isBlogS3Key(value: string | null | undefined): boolean {
  return isBlogImageS3Key(value) || isBlogVideoS3Key(value)
}

/**
 * Обложка / картинка: S3 key → public URL; локальный путь и http(s) — как есть.
 */
export function getBlogCoverSrc(value: string | null | undefined): string | null {
  if (!value) return null
  const raw = value.trim()
  if (!raw) return null

  if (isBlogImageS3Key(raw) || isBlogVideoS3Key(raw)) {
    const base = getNextPublicYaPublicBase()
    if (base) return getPublicObjectUrlFromBase(base, raw)
    return null
  }

  return raw
}

/** Локальный путь или S3-ключ обложки/картинки — можно удалять через delete API. */
export function isManagedBlogImageRef(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isBlogImageS3Key(v)) return true
  if (isLocalBlogUploadUrl(v)) return true
  const key = tryExtractBlogKeyFromPublicUrl(v)
  return Boolean(key && isBlogImageS3Key(key))
}

export function isManagedBlogVideoRef(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isBlogVideoS3Key(v)) return true
  if (isLocalBlogVideoUploadUrl(v)) return true
  const key = tryExtractBlogKeyFromPublicUrl(v)
  return Boolean(key && isBlogVideoS3Key(key))
}

/**
 * Достаёт S3 key из публичного URL бакета (NEXT_PUBLIC_YA_PUBLIC_BASE).
 */
export function tryExtractBlogKeyFromPublicUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return null
  const base = getNextPublicYaPublicBase()
  if (!base) return null
  const prefix = `${base}/`
  if (!trimmed.startsWith(prefix)) return null
  const key = trimmed.slice(prefix.length).split("?")[0] ?? ""
  if (!isBlogS3Key(key)) return null
  return key
}

export function isLegacyLocalBlogImagePath(value: string | null | undefined): boolean {
  return isLocalBlogUploadUrl(value)
}

export function isLegacyLocalBlogVideoPath(value: string | null | undefined): boolean {
  return isLocalBlogVideoUploadUrl(value)
}

export { BLOG_UPLOAD_PUBLIC_PREFIX, BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX }
