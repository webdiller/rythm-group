import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceBlogCategories } from "@/lib/services/blog-categories"
import { PatchCategoryBody } from "@/lib/schemas/blog-categories"

export const runtime = "nodejs"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
	try {
		requireAuth(request)
		const { id: idStr } = await ctx.params
		const id = Number(idStr)
		if (Number.isNaN(id)) {
			return NextResponse.json({ error: "Invalid id" }, { status: 400 })
		}
		const body = await request.json()
		const parsed = PatchCategoryBody.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json({ error: "Validation failed", errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServiceBlogCategories.patch(id, parsed.data)
		return NextResponse.json(result)
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		if (error instanceof Error && error.message === "NOT_FOUND") {
			return NextResponse.json({ error: "Not found" }, { status: 404 })
		}
		if (error instanceof Error && error.message === "SLUG_NOT_UNIQUE") {
			return NextResponse.json({ error: "Slug already in use" }, { status: 409 })
		}
		console.error("Blog categories PATCH:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
	try {
		requireAuth(request)
		const confirm = request.nextUrl.searchParams.get("confirm") === "true"
		if (!confirm) {
			return NextResponse.json({ error: "confirm=true required" }, { status: 400 })
		}
		const { id: idStr } = await ctx.params
		const id = Number(idStr)
		if (Number.isNaN(id)) {
			return NextResponse.json({ error: "Invalid id" }, { status: 400 })
		}
		const result = ServiceBlogCategories.softDeleteCategory(id)
		return NextResponse.json(result)
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		if (error instanceof Error && error.message === "NOT_FOUND") {
			return NextResponse.json({ error: "Not found" }, { status: 404 })
		}
		console.error("Blog categories DELETE:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
