import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceBlogPosts } from "@/lib/services/blog-posts"
import { PatchPostBody } from "@/lib/schemas/blog-posts"

export const runtime = "nodejs"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    requireAuth(request)
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const row = ServiceBlogPosts.getByIdForAdmin(id)
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return NextResponse.json({ data: row, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog post GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  try {
    requireAuth(request)
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const body = (await request.json()) as Record<string, unknown>
    const parsed = PatchPostBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = await ServiceBlogPosts.patch(id, parsed.data, body)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (error instanceof Error && error.message === "SLUG_NOT_UNIQUE") {
      return NextResponse.json({ error: "Slug already in use in this category" }, { status: 409 })
    }
    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return NextResponse.json({ error: "Category not found" }, { status: 400 })
    }
    console.error("Blog post PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    requireAuth(request)
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }
    const result = await ServiceBlogPosts.softDelete(id)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.error("Blog post DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
