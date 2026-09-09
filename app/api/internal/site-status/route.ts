export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tableSiteSettings, tableContacts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
	const db = getDb()

	const settingsRow = db.select().from(tableSiteSettings).limit(1).all()[0]
	const contactRow = db.select().from(tableContacts).where(eq(tableContacts.scope, "landing")).limit(1).all()[0]

	return NextResponse.json({
		site_published: settingsRow?.site_published ?? true,
		telegram_url: contactRow?.telegram_url ?? null,
	})
}
