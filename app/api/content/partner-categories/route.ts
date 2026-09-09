import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServicePartnerCategories } from "@/lib/services/partner-categories"
import { CreateOneBody, UpdateOneBody, DeleteOneParams } from "@/lib/schemas/partner-categories"

export async function GET() {
	const result = ServicePartnerCategories.getAll()
	return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
	try {
		requireAuth(request)
		const body = await request.json()
		const parsed = CreateOneBody.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json({ error: "name is required", errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServicePartnerCategories.createOne(parsed.data)
		return NextResponse.json(result, { status: 201 })
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Create partner category error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		requireAuth(request)
		const body = await request.json()
		const parsed = UpdateOneBody.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json({ error: "id is required", errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServicePartnerCategories.updateOne({ id: String(parsed.data.id) }, parsed.data)
		return NextResponse.json(result)
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Update partner category error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest) {
	try {
		requireAuth(request)
		const { searchParams } = new URL(request.url)
		const id = searchParams.get("id")
		const parsed = DeleteOneParams.safeParse({ id: id ?? "" })
		if (!parsed.success) {
			return NextResponse.json({ error: "id is required" }, { status: 400 })
		}
		ServicePartnerCategories.deleteOne(parsed.data)
		return NextResponse.json({ success: true })
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Delete partner category error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
