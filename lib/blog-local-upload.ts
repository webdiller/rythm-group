import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

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
  const absDir = path.join(process.cwd(), "public", "uploads", "blog")
  await fs.mkdir(absDir, { recursive: true })
  await fs.writeFile(path.join(absDir, name), buf)
  return `/uploads/blog/${name}`
}
