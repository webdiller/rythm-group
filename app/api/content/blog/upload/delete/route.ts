import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import {
  deleteBlogAssetByRef,
  extractBlogKeyFromUrl,
  isBlogS3Key,
} from "@/lib/s3/blog-assets"
import { isLocalBlogUploadUrl, isLocalBlogVideoUploadUrl } from "@/lib/blog/local-upload-url"

export const runtime = "nodejs"

const Body = z.object({
  url: z.string().min(1),
})

function isDeletableBlogRef(url: string): boolean {
  const trimmed = url.trim()
  if (isBlogS3Key(trimmed)) return true
  if (extractBlogKeyFromUrl(trimmed)) return true
  if (isLocalBlogUploadUrl(trimmed)) return true
  if (isLocalBlogVideoUploadUrl(trimmed)) return true
  return false
}

/** Удаление файла блога: S3 key / public S3 URL / legacy `/uploads/blog/...`. */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const json = await request.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }
    const { url } = parsed.data
    if (!isDeletableBlogRef(url)) {
      return NextResponse.json({ error: "Not a managed blog upload path" }, { status: 400 })
    }
    await deleteBlogAssetByRef(url)
    return NextResponse.json({ data: { ok: true }, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog upload delete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
