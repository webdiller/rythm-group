import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await context.params
  const id = Number(idParam)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const db = getDb()
  const row = db
    .select({
      logo_url: tablePartners.logo_url,
    })
    .from(tablePartners)
    .where(eq(tablePartners.id, id))
    .get()

  if (!row || !row.logo_url) {
    return NextResponse.json({ error: "Logo not found" }, { status: 404 })
  }

  const buffer = Buffer.from(row.logo_url, "base64")

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}

