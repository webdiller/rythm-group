import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"
import { DEFAULT_HEADER_NAV_ORDER, normalizeHeaderNavOrder } from "@/lib/header-nav"

export const runtime = "nodejs"

type PartnersDisplayMode = "name" | "logo" | "logoAndName"
type ContactLayout = "formFirst" | "contactsFirst"
type ChannelsCardAlign = "left" | "center" | "right"

type SiteSettingsPayload = {
  logo_text?: string | null
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
  heroAnimationEnabled?: boolean | null
  partnersDisplayMode?: PartnersDisplayMode | null
  channels_show_subscribers?: boolean | null
  channels_show_reach?: boolean | null
  channels_card_align?: ChannelsCardAlign | null
  contactLayout?: ContactLayout | null
  contactFormHidden?: boolean | null
  affiliate_contact_layout?: ContactLayout | null
  affiliate_contact_form_hidden?: boolean | null
  blog_show_dates?: boolean | null
  affiliate_show_blog_block?: boolean | null
  affiliate_show_hero?: boolean | null
  affiliate_show_formats?: boolean | null
  affiliate_show_cases?: boolean | null
  affiliate_show_steam?: boolean | null
  affiliate_show_faq?: boolean | null
  affiliate_show_contacts?: boolean | null
  headerNavOrder?: string[] | null
  page_blog_enabled?: boolean | null
  page_affiliate_enabled?: boolean | null
  site_published?: boolean | null
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
    const currentChannelsShowSubscribers = existing?.channels_show_subscribers ?? true
    const currentChannelsShowReach = existing?.channels_show_reach ?? true
    const currentChannelsCardAlign =
      (existing?.channels_card_align as ChannelsCardAlign | null | undefined) ?? "left"
    const currentLogoText = existing?.logo_text ?? null
    const currentContactLayout =
      (existing?.contactLayout as ContactLayout | null | undefined) ?? "formFirst"
    const currentContactFormHidden = existing?.contactFormHidden ?? false
    const currentAffiliateContactLayout =
      (existing?.affiliate_contact_layout as ContactLayout | null | undefined) ?? "formFirst"
    const currentAffiliateContactFormHidden = existing?.affiliate_contact_form_hidden ?? false
    const currentBlogShowDates = existing?.blog_show_dates ?? true
    const currentAffiliateBlog = existing?.affiliate_show_blog_block ?? true
    const currentAffiliateHero = existing?.affiliate_show_hero ?? true
    const currentAffiliateFormats = existing?.affiliate_show_formats ?? true
    const currentAffiliateCases = existing?.affiliate_show_cases ?? true
    const currentAffiliateSteam = existing?.affiliate_show_steam ?? true
    const currentAffiliateFaq = existing?.affiliate_show_faq ?? true
    const currentAffiliateContacts = existing?.affiliate_show_contacts ?? true
    const currentPageBlogEnabled = existing?.page_blog_enabled ?? true
    const currentPageAffiliateEnabled = existing?.page_affiliate_enabled ?? true
    const currentSitePublished = existing?.site_published ?? true
    const currentHeaderNavOrder = (() => {
      try {
        if (!existing?.headerNavOrder) return [...DEFAULT_HEADER_NAV_ORDER]
        return normalizeHeaderNavOrder(JSON.parse(existing.headerNavOrder))
      } catch {
        return [...DEFAULT_HEADER_NAV_ORDER]
      }
    })()

    const updateValues = {
      logo_text:
        body.logo_text === undefined
          ? currentLogoText
          : body.logo_text
            ? body.logo_text.trim()
            : null,
      privacyPolicyUrl: body.privacyPolicyUrl ?? null,
      dataProcessingPolicyUrl: body.dataProcessingPolicyUrl ?? null,
      heroAnimationEnabled:
        typeof body.heroAnimationEnabled === "boolean" ? body.heroAnimationEnabled : true,
      partnersDisplayMode: body.partnersDisplayMode ?? currentDisplayMode,
      channels_show_subscribers:
        typeof body.channels_show_subscribers === "boolean"
          ? body.channels_show_subscribers
          : currentChannelsShowSubscribers,
      channels_show_reach:
        typeof body.channels_show_reach === "boolean"
          ? body.channels_show_reach
          : currentChannelsShowReach,
      channels_card_align:
        body.channels_card_align === "left" ||
        body.channels_card_align === "center" ||
        body.channels_card_align === "right"
          ? body.channels_card_align
          : currentChannelsCardAlign,
      contactLayout: body.contactLayout ?? currentContactLayout,
      contactFormHidden:
        typeof body.contactFormHidden === "boolean"
          ? body.contactFormHidden
          : currentContactFormHidden,
      affiliate_contact_layout: body.affiliate_contact_layout ?? currentAffiliateContactLayout,
      affiliate_contact_form_hidden:
        typeof body.affiliate_contact_form_hidden === "boolean"
          ? body.affiliate_contact_form_hidden
          : currentAffiliateContactFormHidden,
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
      affiliate_show_contacts:
        typeof body.affiliate_show_contacts === "boolean"
          ? body.affiliate_show_contacts
          : currentAffiliateContacts,
      page_blog_enabled:
        typeof body.page_blog_enabled === "boolean"
          ? body.page_blog_enabled
          : currentPageBlogEnabled,
      page_affiliate_enabled:
        typeof body.page_affiliate_enabled === "boolean"
          ? body.page_affiliate_enabled
          : currentPageAffiliateEnabled,
      site_published:
        typeof body.site_published === "boolean"
          ? body.site_published
          : currentSitePublished,
      headerNavOrder: JSON.stringify(
        Array.isArray(body.headerNavOrder)
          ? normalizeHeaderNavOrder(body.headerNavOrder)
          : currentHeaderNavOrder,
      ),
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
        logo: null,
        logo_text: updateValues.logo_text ?? null,
        privacyPolicyUrl: updateValues.privacyPolicyUrl ?? null,
        dataProcessingPolicyUrl: updateValues.dataProcessingPolicyUrl ?? null,
        headerNavOrder: updateValues.headerNavOrder ?? JSON.stringify(DEFAULT_HEADER_NAV_ORDER),
        heroAnimationEnabled: updateValues.heroAnimationEnabled ?? true,
        partnersDisplayMode: updateValues.partnersDisplayMode ?? "logoAndName",
        channels_show_subscribers: updateValues.channels_show_subscribers ?? true,
        channels_show_reach: updateValues.channels_show_reach ?? true,
        channels_card_align: updateValues.channels_card_align ?? "left",
        contactLayout: updateValues.contactLayout ?? "formFirst",
        contactFormHidden: updateValues.contactFormHidden ?? false,
        affiliate_contact_layout: updateValues.affiliate_contact_layout ?? "formFirst",
        affiliate_contact_form_hidden: updateValues.affiliate_contact_form_hidden ?? false,
        blog_show_dates: updateValues.blog_show_dates ?? true,
        affiliate_show_blog_block: updateValues.affiliate_show_blog_block ?? true,
        affiliate_show_hero: updateValues.affiliate_show_hero ?? true,
        affiliate_show_formats: updateValues.affiliate_show_formats ?? true,
        affiliate_show_cases: updateValues.affiliate_show_cases ?? true,
        affiliate_show_steam: updateValues.affiliate_show_steam ?? true,
        affiliate_show_faq: updateValues.affiliate_show_faq ?? true,
        affiliate_show_contacts: updateValues.affiliate_show_contacts ?? true,
        page_blog_enabled: updateValues.page_blog_enabled ?? true,
        page_affiliate_enabled: updateValues.page_affiliate_enabled ?? true,
        site_published: updateValues.site_published ?? true,
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

