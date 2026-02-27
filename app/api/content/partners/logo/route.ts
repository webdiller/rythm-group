import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const file = formData.get("file")
    const partnerIdRaw = formData.get("partnerId")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    if (!partnerIdRaw) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 })
    }

    const partnerId = Number(partnerIdRaw)
    if (Number.isNaN(partnerId)) {
      return NextResponse.json({ error: "partnerId must be a number" }, { status: 400 })
    }

    const size = file.size
    const maxSizeBytes = 5 * 1024 * 1024
    if (size > maxSizeBytes) {
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const optimizedBuffer = await sharp(inputBuffer)
      .resize(320, 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 80 })
      .toBuffer()

    const base64 = optimizedBuffer.toString("base64")

    const db = getDb()
    const [updated] = db
      .update(tablePartners)
      .set({ logo_url: base64 })
      .where(eq(tablePartners.id, partnerId))
      .returning()
      .all()

    if (!updated) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload partner logo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const partnerIdRaw = formData.get("partnerId")

    if (!partnerIdRaw) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 })
    }

    const partnerId = Number(partnerIdRaw)
    if (Number.isNaN(partnerId)) {
      return NextResponse.json({ error: "partnerId must be a number" }, { status: 400 })
    }

    const db = getDb()
    const [updated] = db
      .update(tablePartners)
      .set({ logo_url: null })
      .where(eq(tablePartners.id, partnerId))
      .returning()
      .all()

    if (!updated) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete partner logo error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

