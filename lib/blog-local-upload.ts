import fs from "node:fs/promises"
import path from "node:path"
import {
  BLOG_UPLOAD_PUBLIC_PREFIX,
  BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX,
  isLocalBlogUploadUrl,
  isLocalBlogVideoUploadUrl,
} from "@/lib/blog/local-upload-url"

export { BLOG_UPLOAD_PUBLIC_PREFIX, isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"
export { BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX, isLocalBlogVideoUploadUrl } from "@/lib/blog/local-upload-url"

function blogUploadAbsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "blog")
}

function blogVideoAbsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "blog", "videos")
}

/**
 * Удаляет файл обложки из `public/uploads/blog/`, если `publicUrl` указывает на него.
 * Безопасна от path traversal; отсутствие файла не считается ошибкой.
 */
export async function deleteBlogUploadFileByPublicUrl(publicUrl: string): Promise<void> {
  const trimmed = publicUrl.trim()
  if (!isLocalBlogUploadUrl(trimmed)) return
  let pathname: string
  try {
    pathname = new URL(trimmed, "http://local.invalid").pathname
  } catch {
    return
  }
  const base = pathname.slice(BLOG_UPLOAD_PUBLIC_PREFIX.length)
  const absDir = path.resolve(blogUploadAbsDir())
  const absFile = path.resolve(absDir, base)
  if (!absFile.startsWith(absDir + path.sep)) return
  await fs.unlink(absFile).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err
  })
}

/**
 * Удаляет видео из `public/uploads/blog/videos/`, если `publicUrl` указывает на него.
 */
export async function deleteBlogVideoFileByPublicUrl(publicUrl: string): Promise<void> {
  const trimmed = publicUrl.trim()
  if (!isLocalBlogVideoUploadUrl(trimmed)) return
  let pathname: string
  try {
    pathname = new URL(trimmed, "http://local.invalid").pathname
  } catch {
    return
  }
  const base = pathname.slice(BLOG_VIDEO_UPLOAD_PUBLIC_PREFIX.length)
  const absDir = path.resolve(blogVideoAbsDir())
  const absFile = path.resolve(absDir, base)
  if (!absFile.startsWith(absDir + path.sep)) return
  await fs.unlink(absFile).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err
  })
}
