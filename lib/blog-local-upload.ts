import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import { BLOG_UPLOAD_PUBLIC_PREFIX, isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"

export { BLOG_UPLOAD_PUBLIC_PREFIX, isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"

function blogUploadAbsDir(): string {
  return path.join(process.cwd(), "public", "uploads", "blog")
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

/** Локальная загрузка обложек блога в `public/uploads/blog/` (URL вида `/uploads/blog/...`). */
export async function putBlogImageToPublic(buf: Buffer, mime: string): Promise<string> {
  const ext =
    mime === "image/jpeg"
      ? ".jpg"
      : mime === "image/png"
        ? ".png"
        : mime === "image/webp"
          ? ".webp"
          : ".gif"
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
  const absDir = blogUploadAbsDir()
  await fs.mkdir(absDir, { recursive: true })
  await fs.writeFile(path.join(absDir, name), buf)
  return `/uploads/blog/${name}`
}
