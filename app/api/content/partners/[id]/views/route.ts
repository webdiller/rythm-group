import { NextRequest, NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { createHash } from "crypto"
import { getDb } from "@/lib/db"
import { tableAffiliatePartnerViews, tablePartners } from "@/lib/db/schema"

export const runtime = "nodejs"

function getClientIp(request: NextRequest): string {
	const fwd = request.headers.get("x-forwarded-for")
	if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown"
	const realIp = request.headers.get("x-real-ip")
	return realIp ?? "unknown"
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id: idParam } = await context.params
		const partnerId = Number(idParam)
		if (Number.isNaN(partnerId)) {
			return NextResponse.json({ error: "Invalid id" }, { status: 400 })
		}

		const ipHash = createHash("sha256").update(getClientIp(request)).digest("hex")
		const db = getDb()

		const exists = db.select().from(tablePartners).where(eq(tablePartners.id, partnerId)).get()
		if (!exists) return NextResponse.json({ error: "Partner not found" }, { status: 404 })

		const alreadySeen = db
			.select()
			.from(tableAffiliatePartnerViews)
			.where(and(eq(tableAffiliatePartnerViews.partner_id, partnerId), eq(tableAffiliatePartnerViews.ip_hash, ipHash)))
			.get()

		if (!alreadySeen) {
			db.insert(tableAffiliatePartnerViews)
				.values({
					partner_id: partnerId,
					ip_hash: ipHash,
				})
				.run()
			db.update(tablePartners)
				.set({ views: sql`${tablePartners.views} + 1` })
				.where(eq(tablePartners.id, partnerId))
				.run()
		}

		const row = db.select({ views: tablePartners.views }).from(tablePartners).where(eq(tablePartners.id, partnerId)).get()

		return NextResponse.json({
			data: { views: row?.views ?? 0, incremented: !alreadySeen },
			meta: null,
		})
	} catch (error) {
		console.error("Partner views increment error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
