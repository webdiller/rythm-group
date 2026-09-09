import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteSiteAssetIfStored, uploadSiteFaviconPng } from "@/lib/s3/site-assets"
import { sanitizeSiteSettingsBranding } from "@/lib/server/sanitize-site-branding"

export const runtime = "nodejs"

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

    const optimizedBuffer = await sharp(inputBuffer).resize(32, 32, { fit: "cover" }).png({ quality: 80 }).toBuffer()

    const key = await uploadSiteFaviconPng(optimizedBuffer)

    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
    const previous = existing?.favicon ?? null

    try {
      if (existing) {
        const [updated] = db.update(tableSiteSettings).set({ favicon: key }).where(eq(tableSiteSettings.id, existing.id)).returning().all()
        if (previous && previous !== key) await deleteSiteAssetIfStored(previous)
        return NextResponse.json({
          data: updated ? sanitizeSiteSettingsBranding(updated) : null,
          meta: null,
        })
      }

      const [created] = db.insert(tableSiteSettings).values({ favicon: key }).returning().all()
      return NextResponse.json({ data: created ? sanitizeSiteSettingsBranding(created) : null, meta: null }, { status: 201 })
    } catch (error) {
      await deleteSiteAssetIfStored(key)
      throw error
    }
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
      return NextResponse.json({ data: null, meta: null })
    }

    const previous = existing.favicon
    const [updated] = db.update(tableSiteSettings).set({ favicon: null }).where(eq(tableSiteSettings.id, existing.id)).returning().all()

    await deleteSiteAssetIfStored(previous)

    return NextResponse.json({
      data: updated ? sanitizeSiteSettingsBranding(updated) : null,
      meta: null,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete favicon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
