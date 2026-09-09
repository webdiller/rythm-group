import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceTranslations } from "@/lib/services/translations"
import { GetAllQueryParams, CreateOneBody, UpdateOneBody, DeleteOneParams } from "@/lib/schemas/translations"

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const query = Object.fromEntries(searchParams.entries())
		const parsed = GetAllQueryParams.safeParse(query)
		if (!parsed.success) {
			return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServiceTranslations.getAll(parsed.data)
		return NextResponse.json(result)
	} catch (error) {
		console.error("Get translations error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		requireAuth(request)
		const body = await request.json()
		const parsed = CreateOneBody.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json({ error: "locale, section, and key are required", errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServiceTranslations.createOne(parsed.data)
		return NextResponse.json(result, { status: 201 })
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		const err = error as { code?: string }
		if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
			return NextResponse.json(
				{
					error: "Translation with this locale, section and key already exists. Use update instead.",
				},
				{ status: 409 },
			)
		}
		console.error("Create translation error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		requireAuth(request)
		const body = (await request.json()) as {
			id?: unknown
			locale?: string
			section?: string
			key?: string
			value?: string
		}
		const { id, ...rest } = body
		if (id == null) {
			return NextResponse.json({ error: "id is required" }, { status: 400 })
		}
		const paramsParsed = DeleteOneParams.safeParse({ id: String(id) })
		const bodyParsed = UpdateOneBody.safeParse(rest)
		if (!paramsParsed.success || !bodyParsed.success) {
			return NextResponse.json({ errors: (paramsParsed.success ? bodyParsed.error : paramsParsed.error)?.flatten() }, { status: 400 })
		}
		const result = ServiceTranslations.updateOne(paramsParsed.data, bodyParsed.data)
		return NextResponse.json(result)
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Update translation error:", error)
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
		ServiceTranslations.deleteOne(parsed.data)
		return NextResponse.json({ success: true })
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Delete translation error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
