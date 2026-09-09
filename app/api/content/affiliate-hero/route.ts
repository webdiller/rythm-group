import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceAffiliateHero } from "@/lib/services/affiliate-hero"
import { UpsertBody } from "@/lib/schemas/affiliate-hero"

export async function GET() {
	const result = ServiceAffiliateHero.getOne()
	return NextResponse.json(result)
}

export async function PUT(request: NextRequest) {
	try {
		requireAuth(request)
		const body = await request.json()
		const parsed = UpsertBody.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid body", errors: parsed.error.flatten() }, { status: 400 })
		}
		const result = ServiceAffiliateHero.upsert(parsed.data)
		return NextResponse.json(result)
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Update affiliate hero error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
