import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"
import { isSafeBlogUploadFileName } from "@/lib/blog/local-upload-url"

export const runtime = "nodejs"

/**
 * Отдаёт видео из `public/uploads/blog/videos/` с диска.
 * Нужен как явный route в production, чтобы не зависеть от поведения static `public` после `next build`.
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

  const absDir = path.join(process.cwd(), "public", "uploads", "blog", "videos")
  const absFile = path.join(absDir, name)
  const rel = path.relative(absDir, absFile)
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return new NextResponse("Not Found", { status: 404 })
  }

  try {
    const buf = await fs.readFile(absFile)
    const ext = path.extname(name).toLowerCase()
    const contentType =
      ext === ".mp4"
        ? "video/mp4"
        : ext === ".webm"
          ? "video/webm"
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
