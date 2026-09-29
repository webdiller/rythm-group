import { readFileSync } from "node:fs"
import { and, eq } from "drizzle-orm"
import { getDb } from "@/lib/db"
import {
  tableAboutCards,
  tableAffiliateFaq,
  tableAffiliateFormats,
  tableAffiliatePartnerViews,
  tableChannels,
  tablePartners,
  tableTranslations,
} from "@/lib/db/schema"
import {
  deleteChannelAvatarIfStored,
  isChannelAvatarS3Key,
  uploadChannelAvatarWebp,
} from "@/lib/s3/channel-avatar"
import {
  deletePartnerLogoIfStored,
  isPartnerLogoS3Key,
  uploadPartnerLogoWebp,
} from "@/lib/s3/partner-logo"
import { parsePartnerCaseGalleryJson } from "@/lib/s3/partner-gallery-url"
import { deleteObjectByKey } from "@/lib/s3/objects"
import {
  formatChannelMetric,
  getAvatarsDirPath,
  getLocalDataFilePath,
  listAvatarFilenames,
  loadLocalDataFile,
  normalizeAboutIcon,
  resolveAvatarAbsolutePath,
  type LocalDataFile,
} from "@/lib/local-seed/load-data"
import type { LocalSeedPlan } from "@/lib/local-seed/types"

function upsertTranslation(locale: string, section: string, key: string, value: string): void {
  const db = getDb()
  const existing = db
    .select()
    .from(tableTranslations)
    .where(
      and(
        eq(tableTranslations.locale, locale),
        eq(tableTranslations.section, section),
        eq(tableTranslations.key, key),
      ),
    )
    .get()

  if (existing) {
    db.update(tableTranslations)
      .set({ value })
      .where(eq(tableTranslations.id, existing.id))
      .run()
  } else {
    db.insert(tableTranslations).values({ locale, section, key, value }).run()
  }
}

function collectLocalAvatarStats(
  items: { localAvatar?: string }[],
): { found: number; missing: string[] } {
  const missing: string[] = []
  let found = 0
  for (const item of items) {
    const abs = resolveAvatarAbsolutePath(item.localAvatar)
    if (abs) found += 1
    else if (item.localAvatar) missing.push(item.localAvatar)
  }
  return { found, missing }
}

export function buildLocalSeedPlan(data?: LocalDataFile): LocalSeedPlan {
  const dataFile = getLocalDataFilePath()
  const avatarsDir = getAvatarsDirPath()
  let parsed = data
  let dataFileExists = true
  try {
    parsed = parsed ?? loadLocalDataFile()
  } catch {
    dataFileExists = false
  }

  const channels = parsed?.channels ?? []
  const partners = parsed?.partners ?? []
  const channelStats = collectLocalAvatarStats(channels)
  const partnerStats = collectLocalAvatarStats(partners)

  const db = getDb()
  return {
    dataFile,
    avatarsDir,
    dataFileExists,
    channelsInFile: channels.length,
    partnersInFile: partners.length,
    avatarsFound: channelStats.found + partnerStats.found,
    avatarsMissing: [...channelStats.missing, ...partnerStats.missing],
    willReplace: {
      channels: db.select().from(tableChannels).all().length,
      partners: db.select().from(tablePartners).all().length,
      about_cards: db.select().from(tableAboutCards).all().length,
      affiliate_formats: db.select().from(tableAffiliateFormats).all().length,
      affiliate_faq: db.select().from(tableAffiliateFaq).all().length,
      translation_keys: 14,
    },
  }
}

export async function seedFromLocalData(): Promise<{
  created: Record<string, number>
  deletedChannelAvatars: number
  deletedPartnerLogos: number
  skippedAvatars: string[]
}> {
  const data = loadLocalDataFile()
  const db = getDb()
  const created: Record<string, number> = {}
  const skippedAvatars: string[] = []

  // --- Channels ---
  const existingChannels = db.select().from(tableChannels).all()
  let deletedChannelAvatars = 0
  for (const row of existingChannels) {
    if (isChannelAvatarS3Key(row.avatar)) {
      await deleteChannelAvatarIfStored(row.avatar)
      deletedChannelAvatars += 1
    }
  }
  db.delete(tableChannels).run()

  let channelCount = 0
  for (let i = 0; i < data.channels.length; i++) {
    const ch = data.channels[i]
    const [inserted] = db
      .insert(tableChannels)
      .values({
        id: ch.id,
        category_id: null,
        name: ch.name,
        subscribers: formatChannelMetric(ch.subscribers),
        reach: formatChannelMetric(ch.reach),
        url: ch.url,
        order_index: i,
        avatar: null,
      })
      .returning()
      .all()

    const channelId = inserted?.id ?? ch.id
    const avatarPath = resolveAvatarAbsolutePath(ch.localAvatar)
    if (avatarPath) {
      const buffer = readFileSync(avatarPath)
      const key = await uploadChannelAvatarWebp(channelId, buffer)
      db.update(tableChannels).set({ avatar: key }).where(eq(tableChannels.id, channelId)).run()
    } else if (ch.localAvatar) {
      skippedAvatars.push(ch.localAvatar)
    }
    channelCount += 1
  }
  created.channels = channelCount

  // --- Partners (landing logos) ---
  const existingPartners = db
    .select({ logo_url: tablePartners.logo_url, case_gallery: tablePartners.case_gallery })
    .from(tablePartners)
    .all()
  let deletedPartnerLogos = 0
  for (const row of existingPartners) {
    if (isPartnerLogoS3Key(row.logo_url)) {
      await deletePartnerLogoIfStored(row.logo_url)
      deletedPartnerLogos += 1
    }
    for (const img of parsePartnerCaseGalleryJson(row.case_gallery)) {
      if (img.originalKey) await deleteObjectByKey(img.originalKey)
      if (img.thumbnailKey) await deleteObjectByKey(img.thumbnailKey)
    }
  }
  db.delete(tableAffiliatePartnerViews).run()
  db.delete(tablePartners).run()

  let partnerCount = 0
  for (let i = 0; i < data.partners.length; i++) {
    const p = data.partners[i]
    const [inserted] = db
      .insert(tablePartners)
      .values({
        id: p.id,
        category_id: null,
        name: p.name,
        logo_url: null,
        title_ru: p.name,
        title_en: p.name,
        short_description_ru: null,
        short_description_en: null,
        published_at: null,
        wishlists: 0,
        views: 0,
        target_url: p.url,
        developer_url: p.url,
        steam_game_url: null,
        show_in_landing_cases: true,
        show_in_affiliate_cases: false,
        show_in_affiliate_steam: false,
        show_wishlists: false,
        show_views: false,
        case_gallery: null,
        show_logo_on_case_detail: true,
        related_channel_ids: null,
        order_index: i,
      })
      .returning()
      .all()

    const partnerId = inserted?.id ?? p.id
    const logoPath = resolveAvatarAbsolutePath(p.localAvatar)
    if (logoPath) {
      const buffer = readFileSync(logoPath)
      const key = await uploadPartnerLogoWebp(partnerId, buffer)
      db.update(tablePartners).set({ logo_url: key }).where(eq(tablePartners.id, partnerId)).run()
    } else if (p.localAvatar) {
      skippedAvatars.push(p.localAvatar)
    }
    partnerCount += 1
  }
  created.partners = partnerCount

  // --- About cards ---
  db.delete(tableAboutCards).run()
  const cardCount = Math.max(data.about_ru.cards.length, data.about_en.cards.length)
  for (let i = 0; i < cardCount; i++) {
    const ru = data.about_ru.cards[i]
    const en = data.about_en.cards[i] ?? ru
    if (!ru && !en) continue
    const src = ru ?? en!
    db.insert(tableAboutCards)
      .values({
        icon: normalizeAboutIcon(src.icon),
        icon_image: null,
        title_ru: ru?.title ?? en!.title,
        title_en: en?.title ?? ru!.title,
        text_ru: ru?.description ?? en!.description,
        text_en: en?.description ?? ru!.description,
        hidden: false,
        order_index: i,
      })
      .run()
  }
  created.about_cards = cardCount

  // --- Affiliate formats ---
  db.delete(tableAffiliateFormats).run()
  data.formats.items.forEach((item, i) => {
    db.insert(tableAffiliateFormats)
      .values({
        title_ru: item.title,
        title_en: item.title,
        body_ru: item.description,
        body_en: item.description,
        hidden: false,
        order_index: i,
      })
      .run()
  })
  created.affiliate_formats = data.formats.items.length

  // --- Affiliate FAQ ---
  db.delete(tableAffiliateFaq).run()
  data.faq.forEach((item, i) => {
    db.insert(tableAffiliateFaq)
      .values({
        question_ru: item.question,
        question_en: item.question,
        answer_ru: item.answer,
        answer_en: item.answer,
        hidden: false,
        order_index: i,
      })
      .run()
  })
  created.affiliate_faq = data.faq.length

  // --- Translations ---
  upsertTranslation("ru", "about", "title", data.about_ru.title)
  upsertTranslation("ru", "about", "subtitle", data.about_ru.subtitle)
  upsertTranslation("en", "about", "title", data.about_en.title)
  upsertTranslation("en", "about", "subtitle", data.about_en.subtitle)

  upsertTranslation("ru", "stats", "title", data.stats_ru.title)
  upsertTranslation("ru", "stats", "subtitle", data.stats_ru.subtitle)
  upsertTranslation("ru", "stats", "items", JSON.stringify(data.stats_ru.stats))
  upsertTranslation("en", "stats", "title", data.stats_en.title)
  upsertTranslation("en", "stats", "subtitle", data.stats_en.subtitle)
  upsertTranslation("en", "stats", "items", JSON.stringify(data.stats_en.stats))

  upsertTranslation("ru", "affiliate", "formats.title", data.formats.title)
  upsertTranslation("ru", "affiliate", "formats.subtitle", data.formats.subtitle)
  upsertTranslation("en", "affiliate", "formats.title", data.formats.title)
  upsertTranslation("en", "affiliate", "formats.subtitle", data.formats.subtitle)

  created.translation_keys = 14
  created.avatars_on_disk = listAvatarFilenames().length

  return { created, deletedChannelAvatars, deletedPartnerLogos, skippedAvatars }
}
