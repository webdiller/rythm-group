import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { isSafeBlogUploadFileName } from "@/lib/blog/local-upload-url"

export const runtime = "nodejs"

/**
 * Отдаёт файлы из `public/uploads/blog/` с диска.
 * В production Next после `next build` не всегда отдаёт файлы, добавленные уже на сервере, только через `public`;
 * явный маршрут устраняет 404 для превью и публичной страницы поста.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> }
) {
  const { name: raw } = await context.params
  const name = decodeURIComponent(raw)
  if (!isSafeBlogUploadFileName(name)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  const absDir = path.join(process.cwd(), "public", "uploads", "blog")
  const absFile = path.join(absDir, name)
  const rel = path.relative(absDir, absFile)
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const buf = await fs.readFile(absFile)
    const ext = path.extname(name).toLowerCase()
    const contentType =
      ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".png"
          ? "image/png"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : "application/octet-stream"
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException
    if (err.code === "ENOENT") {
      return new NextResponse("Not Found", { status: 404 })
    }
    throw e
  }
}
