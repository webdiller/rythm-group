import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { putBlogVideoToPublic } from "@/lib/blog-local-upload"
import { assertVideoUploadSizeAndMime } from "@/lib/blog-video-upload"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const form = await request.formData()
    const file = form.get("file")
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    const mime = file.type || "application/octet-stream"
    try {
      assertVideoUploadSizeAndMime(buf.length, mime)
    } catch (e) {
      if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "File must be at most 100 MB" }, { status: 400 })
      }
      if (e instanceof Error && e.message === "MIME_NOT_ALLOWED") {
        return NextResponse.json({ error: "Allowed: mp4, webm" }, { status: 400 })
      }
      throw e
    }
    const url = await putBlogVideoToPublic(buf, mime)
    return NextResponse.json({ data: { url }, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog video upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
