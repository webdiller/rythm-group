import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { promises as fs } from "node:fs"
import path from "node:path"

export const runtime = "nodejs"

export async function GET() {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

  if (existing?.favicon) {
    const buffer = Buffer.from(existing.favicon, "base64")
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  }

  // Fallback to default favicon from public
  try {
    const faviconPath = path.join(process.cwd(), "public", "favicon.ico")
    const fileBuffer = await fs.readFile(faviconPath)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/x-icon",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    const size = file.size
    const maxSizeBytes = 5 * 1024 * 1024
    if (size > maxSizeBytes) {
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const optimizedBuffer = await sharp(inputBuffer)
      .resize(32, 32, { fit: "cover" })
      .png({ quality: 80 })
      .toBuffer()

    const base64 = optimizedBuffer.toString("base64")

    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    if (existing) {
      const [updated] = db
        .update(tableSiteSettings)
        .set({ favicon: base64 })
        .where(eq(tableSiteSettings.id, existing.id))
        .returning()
        .all()
      return NextResponse.json({ data: updated, meta: null })
    }

    const [created] = db.insert(tableSiteSettings).values({ favicon: base64 }).returning().all()
    return NextResponse.json({ data: created, meta: null }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload favicon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)
    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    if (!existing) {
      // Nothing to delete, but fallback will still use default favicon
      return NextResponse.json({ data: null, meta: null })
    }

    const [updated] = db
      .update(tableSiteSettings)
      .set({ favicon: null })
      .where(eq(tableSiteSettings.id, existing.id))
      .returning()
      .all()

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete favicon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

