import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceBlogPosts } from "@/lib/services/blog-posts"
import { CreatePostBody } from "@/lib/schemas/blog-posts"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const categoryIdRaw = request.nextUrl.searchParams.get("categoryId")
    const statusRaw = request.nextUrl.searchParams.get("status")
    let categoryId: number | undefined
    if (categoryIdRaw != null && categoryIdRaw !== "") {
      const n = Number(categoryIdRaw)
      if (Number.isNaN(n)) {
        return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 })
      }
      categoryId = n
    }
    const status =
      statusRaw === "draft" || statusRaw === "published"
        ? statusRaw
        : undefined
    const result = ServiceBlogPosts.listForAdmin({
      categoryId,
      status,
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog posts GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreatePostBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceBlogPosts.create(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "SLUG_NOT_UNIQUE") {
      return NextResponse.json({ error: "Slug already in use in this category" }, { status: 409 })
    }
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }
    console.error("Blog posts POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
