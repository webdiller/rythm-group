import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"

type PartnersDisplayMode = "name" | "logo" | "logoAndName"

type SiteSettingsPayload = {
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
  heroAnimationEnabled?: boolean | null
  partnersDisplayMode?: PartnersDisplayMode | null
}

export async function GET() {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

  return NextResponse.json({
    data: existing ?? null,
    meta: null,
  })
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)

    const body = (await request.json()) as SiteSettingsPayload
    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    const currentDisplayMode =
      (existing?.partnersDisplayMode as PartnersDisplayMode | null | undefined) ??
      "logoAndName"

    const updateValues: SiteSettingsPayload = {
      privacyPolicyUrl: body.privacyPolicyUrl ?? null,
      dataProcessingPolicyUrl: body.dataProcessingPolicyUrl ?? null,
      heroAnimationEnabled:
        typeof body.heroAnimationEnabled === "boolean" ? body.heroAnimationEnabled : true,
      partnersDisplayMode: body.partnersDisplayMode ?? currentDisplayMode,
    }

    if (existing) {
      const [updated] = db
        .update(tableSiteSettings)
        .set(updateValues)
        .where(eq(tableSiteSettings.id, existing.id))
        .returning()
        .all()

      return NextResponse.json({ data: updated, meta: null })
    }

    const [created] = db
      .insert(tableSiteSettings)
      .values({
        favicon: null,
        privacyPolicyUrl: updateValues.privacyPolicyUrl ?? null,
        dataProcessingPolicyUrl: updateValues.dataProcessingPolicyUrl ?? null,
        heroAnimationEnabled: updateValues.heroAnimationEnabled ?? true,
        partnersDisplayMode: updateValues.partnersDisplayMode ?? "logoAndName",
      })
      .returning()
      .all()

    return NextResponse.json({ data: created, meta: null }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Update site settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

