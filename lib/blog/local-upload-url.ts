/** Публичный префикс путей локальных обложек (`public/uploads/blog/`). */
export const BLOG_UPLOAD_PUBLIC_PREFIX = "/uploads/blog/"

/** Проверка, что значение — наш локальный файл обложки (один сегмент имени в `uploads/blog/`). */
export function isLocalBlogUploadUrl(url: string | null | undefined): boolean {
  if (url == null || typeof url !== "string") return false
  const trimmed = url.trim()
  if (!trimmed.startsWith("/")) return false
  try {
    const pathname = new URL(trimmed, "http://local.invalid").pathname
    if (!pathname.startsWith(BLOG_UPLOAD_PUBLIC_PREFIX)) return false
    const base = pathname.slice(BLOG_UPLOAD_PUBLIC_PREFIX.length)
    if (!base || base.includes("/") || base.includes("..")) return false
    return /^[\w.-]+$/.test(base)
  } catch {
    return false
  }
}
