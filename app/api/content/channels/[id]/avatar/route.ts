import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tableChannels } from "@/lib/db/schema"
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
      avatar: tableChannels.avatar,
    })
    .from(tableChannels)
    .where(eq(tableChannels.id, id))
    .get()

  if (!row || !row.avatar) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 })
  }

  const buffer = Buffer.from(row.avatar, "base64")

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}

