import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { assertUploadSizeAndMime, putBlogImageToS3 } from "@/lib/s3-blog-upload"

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
      assertUploadSizeAndMime(buf.length, mime)
    } catch (e) {
      if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
        return NextResponse.json({ error: "File must be at most 10 MB" }, { status: 400 })
      }
      if (e instanceof Error && e.message === "MIME_NOT_ALLOWED") {
        return NextResponse.json({ error: "Allowed: jpg, png, webp, gif" }, { status: 400 })
      }
      throw e
    }
    const url = await putBlogImageToS3(buf, mime, file.name)
    return NextResponse.json({ data: { url }, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "S3_NOT_CONFIGURED") {
      return NextResponse.json(
        {
          error:
            "Upload is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL_PREFIX.",
        },
        { status: 503 }
      )
    }
    console.error("Blog upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
