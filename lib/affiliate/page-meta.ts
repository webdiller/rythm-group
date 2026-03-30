import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { tableTranslations } from "@/lib/db/schema"

export const AFFILIATE_DEFAULT_PAGE_TITLE = "Affiliate | Rythm Group"

export const AFFILIATE_DEFAULT_PAGE_DESCRIPTION =
  "Партнёрство для GameDev и маркетинга: кейсы, вишлисты, форматы сотрудничества. Partnerships for game developers: cases, wishlists, cooperation models."

function pick(rows: { key: string; value: string | null }[], key: string): string | null {
  const v = rows.find((r) => r.key === key)?.value?.trim()
  return v || null
}

/** SEO title/description for `/affiliate` from translations (section `affiliate`, keys `pageTitle`, `pageDescription`). */
export function getAffiliateSeoFromDb(): { title: string; description: string } {
  const db = getDb()
  const ru = db
    .select()
    .from(tableTranslations)
    .where(and(eq(tableTranslations.locale, "ru"), eq(tableTranslations.section, "affiliate")))
    .all()
  const en = db
    .select()
    .from(tableTranslations)
    .where(and(eq(tableTranslations.locale, "en"), eq(tableTranslations.section, "affiliate")))
    .all()
  const title = pick(ru, "pageTitle") ?? pick(en, "pageTitle") ?? AFFILIATE_DEFAULT_PAGE_TITLE
  const description =
    pick(ru, "pageDescription") ?? pick(en, "pageDescription") ?? AFFILIATE_DEFAULT_PAGE_DESCRIPTION
  return { title, description }
}
