import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { deleteBlogUploadFileByPublicUrl } from "@/lib/blog-local-upload"
import { isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"

export const runtime = "nodejs"

const Body = z.object({
  url: z.string().min(1),
})

/** Удаление файла из `public/uploads/blog/` по публичному пути (только для локальных URL). */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const json = await request.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }
    const { url } = parsed.data
    if (!isLocalBlogUploadUrl(url)) {
      return NextResponse.json({ error: "Not a local blog upload path" }, { status: 400 })
    }
    await deleteBlogUploadFileByPublicUrl(url)
    return NextResponse.json({ data: { ok: true }, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog upload delete:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
