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
  category_id: text("category_id")
    .notNull()
    .references(() => tableChannelCategories.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  subscribers: text("subscribers").notNull(),
  url: text("url").notNull(),
  order_index: integer("order_index").default(0),
})

export const relationsChannels = relations(tableChannels, ({ one }) => ({
  category: one(tableChannelCategories, {
    fields: [tableChannels.category_id],
    references: [tableChannelCategories.id],
  }),
}))

// ---------------------------------------------------------------------------
// partners
// ---------------------------------------------------------------------------
export const tablePartners = sqliteTable("partners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  name_short: text("name_short").notNull(),
  order_index: integer("order_index").default(0),
})

export const relationsPartners = relations(tablePartners, () => ({}))

// ---------------------------------------------------------------------------
// contacts
// ---------------------------------------------------------------------------
export const tableContacts = sqliteTable("contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  telegram_url: text("telegram_url").notNull(),
  telegram_username: text("telegram_username"),
})

export const relationsContacts = relations(tableContacts, () => ({}))
