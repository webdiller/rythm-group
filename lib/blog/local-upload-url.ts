/** Публичный префикс путей локальных обложек (`public/uploads/blog/`). */
export const BLOG_UPLOAD_PUBLIC_PREFIX = "/uploads/blog/"
/** Публичный префикс путей локальных видео (`public/uploads/blog/videos/`). */
export const BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX = "/uploads/blog/videos/"

/** Имя файла в `public/uploads/blog/` (без path traversal). */
export function isSafeBlogUploadFileName(name: string): boolean {
  if (!name || name.includes("/") || name.includes("..")) return false
  return /^[\w.-]+$/.test(name)
}

/** Проверка, что значение — наш локальный файл обложки (один сегмент имени в `uploads/blog/`). */
export function isLocalBlogUploadUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed.startsWith("/")) return false
  try {
    const pathname = new URL(trimmed, "http://local.invalid").pathname
    if (!pathname.startsWith(BLOG_UPLOAD_PUBLIC_PREFIX)) return false
    const base = pathname.slice(BLOG_UPLOAD_PUBLIC_PREFIX.length)
    if (!base) return false
    return isSafeBlogUploadFileName(base)
  } catch {
    return false
  }
}

/** Проверка, что значение — наш локальный файл видео (один сегмент имени в `uploads/blog/videos/`). */
export function isLocalBlogVideoUploadUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed.startsWith("/")) return false
  try {
    const pathname = new URL(trimmed, "http://local.invalid").pathname
    if (!pathname.startsWith(BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX)) return false
    const base = pathname.slice(BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX.length)
    if (!base) return false
    return isSafeBlogUploadFileName(base)
  } catch {
    return false
  }
}
