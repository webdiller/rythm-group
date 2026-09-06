import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { created_at, updated_at } from "./common-fields"

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const tableUsers = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  created_at: created_at("created_at"),
})

export const relationsUsers = relations(tableUsers, () => ({}))

// ---------------------------------------------------------------------------
// translations
// ---------------------------------------------------------------------------
export const tableTranslations = sqliteTable(
  "translations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    locale: text("locale").notNull(),
    section: text("section").notNull(),
    key: text("key").notNull(),
    value: text("value"),
  },
  (t) => [unique("translations_locale_section_key").on(t.locale, t.section, t.key)]
)

export const relationsTranslations = relations(tableTranslations, () => ({}))

// ---------------------------------------------------------------------------
// channel_categories
// ---------------------------------------------------------------------------
export const tableChannelCategories = sqliteTable("channel_categories", {
  id: text("id").primaryKey(),
  name_ru: text("name_ru").notNull(),
  name_en: text("name_en").notNull(),
  order_index: integer("order_index").default(0),
})

export const relationsChannelCategories = relations(tableChannelCategories, ({ many }) => ({
  channels: many(tableChannels),
}))

// ---------------------------------------------------------------------------
// channels
// ---------------------------------------------------------------------------
export const tableChannels = sqliteTable("channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category_id: text("category_id").references(() => tableChannelCategories.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  name: text("name").notNull(),
  subscribers: text("subscribers").notNull(),
  // Average reach/coverage per channel (e.g. average views)
  reach: text("reach"),
  url: text("url").notNull(),
  order_index: integer("order_index").default(0),
  avatar: text("avatar"),
})

export const relationsChannels = relations(tableChannels, ({ one }) => ({
  category: one(tableChannelCategories, {
    fields: [tableChannels.category_id],
    references: [tableChannelCategories.id],
  }),
}))

// ---------------------------------------------------------------------------
// partner_categories (for cases/partners grouping)
// ---------------------------------------------------------------------------
export const tablePartnerCategories = sqliteTable("partner_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Legacy single-name column (kept for backward compatibility)
  name: text("name").notNull(),
  // Localized names for landing and admin UI
  name_ru: text("name_ru").notNull(),
  name_en: text("name_en").notNull(),
  order_index: integer("order_index").default(0),
})

export const relationsPartnerCategories = relations(tablePartnerCategories, ({ many }) => ({
  partners: many(tablePartners),
}))

// ---------------------------------------------------------------------------
// partners (cases)
// ---------------------------------------------------------------------------
export const tablePartners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category_id: integer("category_id").references(() => tablePartnerCategories.id, { onDelete: "set null", onUpdate: "cascade" }),
  name: text("name").notNull(),
  logo_url: text("logo_url"),
  title_ru: text("title_ru"),
  title_en: text("title_en"),
  short_description_ru: text("short_description_ru"),
  short_description_en: text("short_description_en"),
  published_at: text("published_at"),
  wishlists: integer("wishlists").default(0),
  views: integer("views").default(0),
  target_url: text("target_url"),
  developer_url: text("developer_url"),
  /** Ссылка на страницу игры в Steam (детальная страница кейса) */
  steam_game_url: text("steam_game_url"),
  show_in_landing_cases: integer("show_in_landing_cases", { mode: "boolean" }).default(true),
  show_in_affiliate_cases: integer("show_in_affiliate_cases", { mode: "boolean" }).default(true),
  show_in_affiliate_steam: integer("show_in_affiliate_steam", { mode: "boolean" }).default(true),
  order_index: integer("order_index").default(0),
})

export const relationsPartners = relations(tablePartners, ({ one }) => ({
  category: one(tablePartnerCategories, {
    fields: [tablePartners.category_id],
    references: [tablePartnerCategories.id],
  }),
}))

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------
export const tableContacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scope: text("scope", { enum: ["landing", "affiliate"] }).default("landing"),
  email: text("email").notNull(),
  telegram_url: text("telegram_url").notNull(),
  telegram_username: text("telegram_username"),
  // JSON-encoded array of direct contact links (social networks, etc.)
  direct_contacts: text("direct_contacts"),
  // JSON-encoded config for mini stats in contact section
  mini_stats: text("mini_stats")
})

export const relationsContacts = relations(tableContacts, () => ({}))

// ---------------------------------------------------------------------------
// site_settings
// ---------------------------------------------------------------------------
export const tableSiteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Base64-encoded PNG (32x32) favicon override
  favicon: text("favicon"),
  // Base64-encoded WebP logo override (header/footer)
  logo: text("logo"),
  // Optional text near logo in header/footer
  logo_text: text("logo_text"),
  privacyPolicyUrl: text("privacy_policy_url"),
  dataProcessingPolicyUrl: text("data_processing_policy_url"),
  // JSON-encoded array of header section ids
  headerNavOrder: text("header_nav_order"),
  heroAnimationEnabled: integer("hero_animation_enabled", { mode: "boolean" }).default(true),
  // How to display partners on landing: "name", "logo", "logoAndName"
  partnersDisplayMode: text("partners_display_mode"),
  /** Блок «Наши каналы»: показывать число подписчиков */
  channels_show_subscribers: integer("channels_show_subscribers", { mode: "boolean" }).default(true),
  /** Блок «Наши каналы»: показывать охват */
  channels_show_reach: integer("channels_show_reach", { mode: "boolean" }).default(true),
  /** Блок «Наши каналы»: выравнивание карточки — left | center | right */
  channels_card_align: text("channels_card_align").default("left"),
  // How to layout contact section: "formFirst" or "contactsFirst"
  contactLayout: text("contact_layout"),
  // If true, hide email form and show only direct contacts
  contactFormHidden: integer("contact_form_hidden", { mode: "boolean" }).default(false),
  // How to layout contact section on /affiliate: "formFirst" or "contactsFirst"
  affiliate_contact_layout: text("affiliate_contact_layout"),
  // If true, hide email form in contact block on /affiliate
  affiliate_contact_form_hidden: integer("affiliate_contact_form_hidden", { mode: "boolean" }).default(false),
  /** Публичный блог: показывать даты у карточек и в записи */
  blog_show_dates: integer("blog_show_dates", { mode: "boolean" }).default(true),
  /** Страница /affiliate: блок мини-блога (до 6 записей) */
  affiliate_show_blog_block: integer("affiliate_show_blog_block", { mode: "boolean" }).default(true),
  affiliate_show_hero: integer("affiliate_show_hero", { mode: "boolean" }).default(true),
  affiliate_show_formats: integer("affiliate_show_formats", { mode: "boolean" }).default(true),
  affiliate_show_cases: integer("affiliate_show_cases", { mode: "boolean" }).default(true),
  affiliate_show_steam: integer("affiliate_show_steam", { mode: "boolean" }).default(true),
  affiliate_show_faq: integer("affiliate_show_faq", { mode: "boolean" }).default(true),
  affiliate_show_contacts: integer("affiliate_show_contacts", { mode: "boolean" }).default(true),
  /** Страница /blog: включена ли страница блога */
  page_blog_enabled: integer("page_blog_enabled", { mode: "boolean" }).default(true),
  /** Страница /affiliate: включена ли страница партнёрства */
  page_affiliate_enabled: integer("page_affiliate_enabled", { mode: "boolean" }).default(true),
  /** Режим обслуживания: если false, сайт показывает страницу заглушку */
  site_published: integer("site_published", { mode: "boolean" }).default(true),
})

export const relationsSiteSettings = relations(tableSiteSettings, () => ({}))

// ---------------------------------------------------------------------------
// affiliate_hero
// ---------------------------------------------------------------------------
export const tableAffiliateHero = sqliteTable("affiliate_hero", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  badge_ru: text("badge_ru").notNull(),
  badge_en: text("badge_en").notNull(),
  title_ru: text("title_ru").notNull(),
  title_en: text("title_en").notNull(),
  subtitle_ru: text("subtitle_ru").notNull(),
  subtitle_en: text("subtitle_en").notNull(),
  cta_primary_ru: text("cta_primary_ru").notNull(),
  cta_primary_en: text("cta_primary_en").notNull(),
  cta_secondary_ru: text("cta_secondary_ru").notNull(),
  cta_secondary_en: text("cta_secondary_en").notNull(),
})

export const relationsAffiliateHero = relations(tableAffiliateHero, () => ({}))

// ---------------------------------------------------------------------------
// affiliate_formats
// ---------------------------------------------------------------------------
export const tableAffiliateFormats = sqliteTable("affiliate_formats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title_ru: text("title_ru").notNull(),
  title_en: text("title_en").notNull(),
  body_ru: text("body_ru").notNull(),
  body_en: text("body_en").notNull(),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
  order_index: integer("order_index").default(0),
})

export const relationsAffiliateFormats = relations(tableAffiliateFormats, () => ({}))

// ---------------------------------------------------------------------------
// affiliate_faq
// ---------------------------------------------------------------------------
export const tableAffiliateFaq = sqliteTable("affiliate_faq", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question_ru: text("question_ru").notNull(),
  question_en: text("question_en").notNull(),
  answer_ru: text("answer_ru").notNull(),
  answer_en: text("answer_en").notNull(),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
  order_index: integer("order_index").default(0),
})

export const relationsAffiliateFaq = relations(tableAffiliateFaq, () => ({}))

// ---------------------------------------------------------------------------
// about_cards (landing «О нас»)
// ---------------------------------------------------------------------------
export const tableAboutCards = sqliteTable("about_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Имя иконки из whitelist (Lucide), например Target; если задан icon_image, показывается он */
  icon: text("icon").notNull(),
  /** WebP base64; при наличии отображается вместо Lucide */
  icon_image: text("icon_image"),
  title_ru: text("title_ru").notNull(),
  title_en: text("title_en").notNull(),
  text_ru: text("text_ru").notNull(),
  text_en: text("text_en").notNull(),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
  order_index: integer("order_index").default(0),
})

export const relationsAboutCards = relations(tableAboutCards, () => ({}))

// ---------------------------------------------------------------------------
// affiliate_partner_views (unique views by IP)
// ---------------------------------------------------------------------------
export const tableAffiliatePartnerViews = sqliteTable(
  "affiliate_partner_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    partner_id: integer("partner_id")
      .notNull()
      .references(() => tablePartners.id, { onDelete: "cascade", onUpdate: "cascade" }),
    ip_hash: text("ip_hash").notNull(),
    created_at: created_at("created_at"),
  },
  (t) => [unique("affiliate_partner_views_partner_ip_unique").on(t.partner_id, t.ip_hash)],
)

export const relationsAffiliatePartnerViews = relations(tableAffiliatePartnerViews, ({ one }) => ({
  partner: one(tablePartners, {
    fields: [tableAffiliatePartnerViews.partner_id],
    references: [tablePartners.id],
  }),
}))

// ---------------------------------------------------------------------------
// blog_categories
// ---------------------------------------------------------------------------
export const tableBlogCategories = sqliteTable("blog_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  name_ru: text("name_ru").notNull(),
  name_en: text("name_en").notNull(),
  order_index: integer("order_index").notNull().default(0),
  /** Unix seconds; NULL = активна */
  deleted_at: integer("deleted_at"),
  created_at: created_at("created_at"),
})

// ---------------------------------------------------------------------------
// blog_posts
// ---------------------------------------------------------------------------
export const tableBlogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  category_id: integer("category_id")
    .notNull()
    .references(() => tableBlogCategories.id, { onDelete: "restrict", onUpdate: "cascade" }),
  slug: text("slug").notNull(),
  title_ru: text("title_ru").notNull(),
  title_en: text("title_en").notNull(),
  excerpt_ru: text("excerpt_ru").notNull(),
  excerpt_en: text("excerpt_en").notNull(),
  body_html_ru: text("body_html_ru").notNull(),
  body_html_en: text("body_html_en").notNull(),
  cover_image_url: text("cover_image_url"),
  status: text("status").notNull().$type<"draft" | "published">(),
  /** Unix seconds; для черновика — время создания или последней смены статуса */
  published_at: integer("published_at").notNull(),
  deleted_at: integer("deleted_at"),
  created_at: created_at("created_at"),
  updated_at: updated_at("updated_at"),
})

export const relationsBlogCategories = relations(tableBlogCategories, ({ many }) => ({
  posts: many(tableBlogPosts),
}))

export const relationsBlogPosts = relations(tableBlogPosts, ({ one }) => ({
  category: one(tableBlogCategories, {
    fields: [tableBlogPosts.category_id],
    references: [tableBlogCategories.id],
  }),
}))
