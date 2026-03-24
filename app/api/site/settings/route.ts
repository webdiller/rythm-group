import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"

export const runtime = "nodejs"

type PartnersDisplayMode = "name" | "logo" | "logoAndName"
type ContactLayout = "formFirst" | "contactsFirst"

type SiteSettingsPayload = {
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
  heroAnimationEnabled?: boolean | null
  partnersDisplayMode?: PartnersDisplayMode | null
  contactLayout?: ContactLayout | null
  contactFormHidden?: boolean | null
  blog_show_dates?: boolean | null
  affiliate_show_blog_block?: boolean | null
  affiliate_show_hero?: boolean | null
  affiliate_show_formats?: boolean | null
  affiliate_show_cases?: boolean | null
  affiliate_show_steam?: boolean | null
  affiliate_show_faq?: boolean | null
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
    const currentContactLayout =
      (existing?.contactLayout as ContactLayout | null | undefined) ?? "formFirst"
    const currentContactFormHidden = existing?.contactFormHidden ?? false
    const currentBlogShowDates = existing?.blog_show_dates ?? true
    const currentAffiliateBlog = existing?.affiliate_show_blog_block ?? true
    const currentAffiliateHero = existing?.affiliate_show_hero ?? true
    const currentAffiliateFormats = existing?.affiliate_show_formats ?? true
    const currentAffiliateCases = existing?.affiliate_show_cases ?? true
    const currentAffiliateSteam = existing?.affiliate_show_steam ?? true
    const currentAffiliateFaq = existing?.affiliate_show_faq ?? true

    const updateValues: SiteSettingsPayload = {
      privacyPolicyUrl: body.privacyPolicyUrl ?? null,
      dataProcessingPolicyUrl: body.dataProcessingPolicyUrl ?? null,
      heroAnimationEnabled:
        typeof body.heroAnimationEnabled === "boolean" ? body.heroAnimationEnabled : true,
      partnersDisplayMode: body.partnersDisplayMode ?? currentDisplayMode,
      contactLayout: body.contactLayout ?? currentContactLayout,
      contactFormHidden:
        typeof body.contactFormHidden === "boolean"
          ? body.contactFormHidden
          : currentContactFormHidden,
      blog_show_dates:
        typeof body.blog_show_dates === "boolean" ? body.blog_show_dates : currentBlogShowDates,
      affiliate_show_blog_block:
        typeof body.affiliate_show_blog_block === "boolean"
          ? body.affiliate_show_blog_block
          : currentAffiliateBlog,
      affiliate_show_hero:
        typeof body.affiliate_show_hero === "boolean" ? body.affiliate_show_hero : currentAffiliateHero,
      affiliate_show_formats:
        typeof body.affiliate_show_formats === "boolean"
          ? body.affiliate_show_formats
          : currentAffiliateFormats,
      affiliate_show_cases:
        typeof body.affiliate_show_cases === "boolean" ? body.affiliate_show_cases : currentAffiliateCases,
      affiliate_show_steam:
        typeof body.affiliate_show_steam === "boolean" ? body.affiliate_show_steam : currentAffiliateSteam,
      affiliate_show_faq:
        typeof body.affiliate_show_faq === "boolean" ? body.affiliate_show_faq : currentAffiliateFaq,
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
        contactLayout: updateValues.contactLayout ?? "formFirst",
        contactFormHidden: updateValues.contactFormHidden ?? false,
        blog_show_dates: updateValues.blog_show_dates ?? true,
        affiliate_show_blog_block: updateValues.affiliate_show_blog_block ?? true,
        affiliate_show_hero: updateValues.affiliate_show_hero ?? true,
        affiliate_show_formats: updateValues.affiliate_show_formats ?? true,
        affiliate_show_cases: updateValues.affiliate_show_cases ?? true,
        affiliate_show_steam: updateValues.affiliate_show_steam ?? true,
        affiliate_show_faq: updateValues.affiliate_show_faq ?? true,
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

