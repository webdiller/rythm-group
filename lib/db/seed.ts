import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import type * as schema from "./schema"
import { sql } from "drizzle-orm"
import {
  tableTranslations,
  tableChannelCategories,
  tableChannels,
  tablePartnerCategories,
  tablePartners,
  tableContacts,
} from "./schema"
import { fallbackTranslations } from "@/lib/i18n"
import { channelCategories, partnerLogos } from "@/lib/data"

function insertNested(
  insert: (locale: string, section: string, fullKey: string, value: string) => void,
  locale: string,
  section: string,
  prefix: string,
  data: Record<string, unknown>
) {
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      insertNested(insert, locale, section, fullKey, value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      insert(locale, section, fullKey, JSON.stringify(value))
    } else {
      insert(locale, section, fullKey, String(value))
    }
  }
}

export function runSeed(
  db: BetterSQLite3Database<typeof schema>
) {

  const existingTranslations = db.select().from(tableTranslations).limit(1).all()
  if (existingTranslations.length === 0) {
    for (const [locale, localeData] of Object.entries(fallbackTranslations)) {
      for (const [section, sectionData] of Object.entries(localeData as Record<string, Record<string, unknown>>)) {
        insertNested(
          (loc, sec, fullKey, value) => {
            db.insert(tableTranslations).values({ locale: loc, section: sec, key: fullKey, value }).run()
          },
          locale,
          section,
          "",
          sectionData
        )
      }
    }
  }

  const existingCategories = db.select().from(tableChannelCategories).limit(1).all()
  if (existingCategories.length === 0) {
    for (let catIndex = 0; catIndex < channelCategories.length; catIndex++) {
      const category = channelCategories[catIndex]
      db.insert(tableChannelCategories)
        .values({
          id: category.id,
          name_ru: category.nameRu,
          name_en: category.nameEn,
          order_index: catIndex,
        })
        .run()
      for (let chIndex = 0; chIndex < category.channels.length; chIndex++) {
        const ch = category.channels[chIndex]
        db.insert(tableChannels)
          .values({
            category_id: category.id,
            name: ch.name,
            subscribers: ch.subscribers,
            url: ch.url,
            order_index: chIndex,
          })
          .run()
      }
    }
  }

  const existingPartnerCategories = db.select().from(tablePartnerCategories).limit(1).all()
  let defaultPartnerCategoryId: number | null = null
  if (existingPartnerCategories.length === 0) {
    const [inserted] = db
      .insert(tablePartnerCategories)
      .values({ name: "Партнёры", order_index: 0 })
      .returning()
      .all()
    if (inserted) defaultPartnerCategoryId = inserted.id
  } else {
    defaultPartnerCategoryId = existingPartnerCategories[0].id
  }

  const existingPartners = db.select().from(tablePartners).limit(1).all()
  if (existingPartners.length === 0 && defaultPartnerCategoryId != null) {
    for (let i = 0; i < partnerLogos.length; i++) {
      db.insert(tablePartners)
        .values({
          category_id: defaultPartnerCategoryId,
          name: partnerLogos[i].name,
          logo_url: null,
          order_index: i,
        })
        .run()
    }
  }

  const existingContacts = db.select().from(tableContacts).limit(1).all()
  if (existingContacts.length === 0) {
    db.insert(tableContacts)
      .values({
        email: "contact@rythmgroup.com",
        telegram_url: "https://t.me/RythmGroup",
        telegram_username: "@RythmGroup",
        direct_contacts: JSON.stringify([
          {
            id: "telegram-main",
            label: "Telegram",
            description: "@RythmGroup",
            url: "https://t.me/RythmGroup",
            type: "telegram",
          },
        ]),
      })
      .run()
  }

  // Ensure new columns exist for site_settings without separate migrations
  try {
    db.run(sql`ALTER TABLE site_settings ADD COLUMN hero_animation_enabled integer DEFAULT 1`)
  } catch {
    // ignore if column already exists
  }
}
