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

  if (existing?.logo) {
    const buffer = Buffer.from(existing.logo, "base64")
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // Логотип меняется из админки по тому же URL — отключаем агрессивный кэш.
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  // Fallback to default logo from public
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.jpg")
    const fileBuffer = await fs.readFile(logoPath)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
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
      .resize(512, 512, { fit: "inside", withoutEnlargement: false })
      .webp({ quality: 85 })
      .toBuffer()

    const base64 = optimizedBuffer.toString("base64")

    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    if (existing) {
      const [updated] = db
        .update(tableSiteSettings)
        .set({ logo: base64 })
        .where(eq(tableSiteSettings.id, existing.id))
        .returning()
        .all()
      return NextResponse.json({ data: updated, meta: null })
    }

    const [created] = db.insert(tableSiteSettings).values({ logo: base64 }).returning().all()
    return NextResponse.json({ data: created, meta: null }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload logo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)
    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    if (!existing) {
      return NextResponse.json({ data: null, meta: null })
    }

    const [updated] = db
      .update(tableSiteSettings)
      .set({ logo: null })
      .where(eq(tableSiteSettings.id, existing.id))
      .returning()
      .all()

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete logo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
