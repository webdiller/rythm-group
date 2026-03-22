import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceBlogCategories } from "@/lib/services/blog-categories"
import { CreateCategoryBody } from "@/lib/schemas/blog-categories"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "1"
    return NextResponse.json(ServiceBlogCategories.listForAdmin(includeDeleted))
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Blog categories GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreateCategoryBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceBlogCategories.create(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "SLUG_NOT_UNIQUE") {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 })
    }
    console.error("Blog categories POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
