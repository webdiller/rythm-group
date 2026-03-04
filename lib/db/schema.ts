import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"
import { created_at } from "./common-fields"

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
  name: text("name").notNull(),
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
  email: text("email").notNull(),
  telegram_url: text("telegram_url").notNull(),
  telegram_username: text("telegram_username"),
  // JSON-encoded array of direct contact links (social networks, etc.)
  direct_contacts: text("direct_contacts"),
})

export const relationsContacts = relations(tableContacts, () => ({}))

// ---------------------------------------------------------------------------
// site_settings
// ---------------------------------------------------------------------------
export const tableSiteSettings = sqliteTable("site_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Base64-encoded PNG (32x32) favicon override
  favicon: text("favicon"),
  privacyPolicyUrl: text("privacy_policy_url"),
  dataProcessingPolicyUrl: text("data_processing_policy_url"),
  heroAnimationEnabled: integer("hero_animation_enabled", { mode: "boolean" }).default(true),
  // How to display partners on landing: "name", "logo", "logoAndName"
  partnersDisplayMode: text("partners_display_mode"),
})

export const relationsSiteSettings = relations(tableSiteSettings, () => ({}))
