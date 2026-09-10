import { getDb } from "@/lib/db"
import {
  tableAffiliatePartnerViews,
  tableBlogPosts,
  tableBlogCategories,
  tablePartners,
  tablePartnerCategories,
  tableChannels,
  tableChannelCategories,
  tableContacts,
  tableContactIcons,
  tableAboutCards,
  tableAffiliateFaq,
  tableAffiliateFormats,
  tableAffiliateHero,
  tableTranslations,
  tableSiteSettings,
} from "@/lib/db/schema"
import { DEFAULT_HEADER_NAV_ORDER } from "@/lib/header-nav"
import type { TableCount } from "@/lib/demo-seed/types"

export function snapshotTableCounts(): TableCount[] {
  const db = getDb()
  return [
    { table: "affiliate_partner_views", rows: db.select().from(tableAffiliatePartnerViews).all().length },
    { table: "blog_posts", rows: db.select().from(tableBlogPosts).all().length },
    { table: "blog_categories", rows: db.select().from(tableBlogCategories).all().length },
    { table: "partners", rows: db.select().from(tablePartners).all().length },
    { table: "partner_categories", rows: db.select().from(tablePartnerCategories).all().length },
    { table: "channels", rows: db.select().from(tableChannels).all().length },
    { table: "channel_categories", rows: db.select().from(tableChannelCategories).all().length },
    { table: "contacts", rows: db.select().from(tableContacts).all().length },
    { table: "contact_icons", rows: db.select().from(tableContactIcons).all().length },
    { table: "about_cards", rows: db.select().from(tableAboutCards).all().length },
    { table: "affiliate_faq", rows: db.select().from(tableAffiliateFaq).all().length },
    { table: "affiliate_formats", rows: db.select().from(tableAffiliateFormats).all().length },
    { table: "affiliate_hero", rows: db.select().from(tableAffiliateHero).all().length },
    { table: "translations", rows: db.select().from(tableTranslations).all().length },
    { table: "site_settings", rows: db.select().from(tableSiteSettings).all().length },
  ]
}

/** Удаляет CMS-данные. Поле logo в site_settings сохраняется. */
export function wipeCmsDataKeepLogo(): { keptLogo: boolean } {
  const db = getDb()

  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const keptLogoValue = existing?.logo ?? null
  const keptLogo = Boolean(keptLogoValue && String(keptLogoValue).trim())

  db.delete(tableAffiliatePartnerViews).run()
  db.delete(tableBlogPosts).run()
  db.delete(tableBlogCategories).run()
  db.delete(tablePartners).run()
  db.delete(tablePartnerCategories).run()
  db.delete(tableChannels).run()
  db.delete(tableChannelCategories).run()
  db.delete(tableContacts).run()
  db.delete(tableContactIcons).run()
  db.delete(tableAboutCards).run()
  db.delete(tableAffiliateFaq).run()
  db.delete(tableAffiliateFormats).run()
  db.delete(tableAffiliateHero).run()
  db.delete(tableTranslations).run()
  db.delete(tableSiteSettings).run()

  db.insert(tableSiteSettings)
    .values({
      logo: keptLogoValue,
      logo_text: null,
      favicon: null,
      privacyPolicyUrl: null,
      dataProcessingPolicyUrl: null,
      headerNavOrder: JSON.stringify([...DEFAULT_HEADER_NAV_ORDER]),
      heroAnimationEnabled: true,
      partnersDisplayMode: "logoAndName",
      channels_show_subscribers: true,
      channels_show_reach: true,
      channels_card_align: "left",
      contactLayout: "formFirst",
      contactFormHidden: false,
      affiliate_contact_layout: "formFirst",
      affiliate_contact_form_hidden: false,
      blog_show_dates: true,
      affiliate_show_blog_block: true,
      affiliate_show_hero: true,
      affiliate_show_formats: true,
      affiliate_show_cases: true,
      affiliate_show_steam: true,
      affiliate_show_faq: true,
      affiliate_show_contacts: true,
      page_blog_enabled: true,
      page_affiliate_enabled: true,
      site_published: true,
      backgrounds: null,
    })
    .run()

  return { keptLogo }
}
