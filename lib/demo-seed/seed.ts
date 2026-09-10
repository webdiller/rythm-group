import { getDb } from "@/lib/db"
import {
  tableTranslations,
  tableChannelCategories,
  tableChannels,
  tablePartnerCategories,
  tablePartners,
  tableContacts,
  tableContactIcons,
  tableAffiliateHero,
  tableAffiliateFormats,
  tableAffiliateFaq,
  tableAboutCards,
  tableBlogCategories,
  tableBlogPosts,
} from "@/lib/db/schema"
import { fallbackTranslations } from "@/lib/i18n"
import { serializeIconFilters, DEFAULT_ICON_FILTERS } from "@/lib/contact-icons/filters"
import { uploadContactIconFile } from "@/lib/s3/contact-icon"

/** 1×1 PNG — минимальная иконка для демо contact_icons */
const DEMO_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

function insertNested(
  insert: (locale: string, section: string, fullKey: string, value: string) => void,
  locale: string,
  section: string,
  prefix: string,
  data: Record<string, unknown>,
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

const CHANNEL_CATS = [
  { id: "gaming", name_ru: "Игры", name_en: "Gaming" },
  { id: "news", name_ru: "Новости", name_en: "News" },
  { id: "reviews", name_ru: "Обзоры", name_en: "Reviews" },
  { id: "community", name_ru: "Сообщество", name_en: "Community" },
] as const

const CHANNEL_NAMES = [
  "Rythm Plays",
  "Indie Pulse",
  "Steam Digest",
  "Pixel Weekly",
  "Co-op Hub",
  "Patch Notes RU",
]

const PARTNER_NAMES = [
  "Nebula Forge",
  "Crystal Quest",
  "Harbor Tales",
  "Skyward Protocol",
  "Ember Syndicate",
  "Quiet Horizon",
]

export async function seedDemoContent(): Promise<Record<string, number>> {
  const db = getDb()
  const created: Record<string, number> = {}

  let translationCount = 0
  for (const [locale, localeData] of Object.entries(fallbackTranslations)) {
    for (const [section, sectionData] of Object.entries(
      localeData as Record<string, Record<string, unknown>>,
    )) {
      insertNested(
        (loc, sec, fullKey, value) => {
          db.insert(tableTranslations)
            .values({ locale: loc, section: sec, key: fullKey, value })
            .run()
          translationCount += 1
        },
        locale,
        section,
        "",
        sectionData,
      )
    }
  }
  created.translations = translationCount

  CHANNEL_CATS.forEach((cat, i) => {
    db.insert(tableChannelCategories)
      .values({
        id: cat.id,
        name_ru: cat.name_ru,
        name_en: cat.name_en,
        order_index: i,
      })
      .run()
  })
  created.channel_categories = CHANNEL_CATS.length

  let channelCount = 0
  for (let i = 0; i < CHANNEL_NAMES.length; i++) {
    const cat = CHANNEL_CATS[i % CHANNEL_CATS.length]
    db.insert(tableChannels)
      .values({
        category_id: cat.id,
        name: CHANNEL_NAMES[i],
        subscribers: `${(12 + i * 7).toFixed(0)}K`,
        reach: `${(1.1 + i * 0.35).toFixed(1)}M`,
        url: `https://t.me/demo_channel_${i + 1}`,
        order_index: i,
        avatar: null,
      })
      .run()
    channelCount += 1
  }
  created.channels = channelCount

  const partnerCatIds: number[] = []
  const partnerCatDefs = [
    { name: "Инди", name_ru: "Инди", name_en: "Indie" },
    { name: "AA", name_ru: "AA", name_en: "AA" },
    { name: "Релизы", name_ru: "Релизы", name_en: "Releases" },
    { name: "Wishlist", name_ru: "Вишлисты", name_en: "Wishlists" },
  ]
  for (let i = 0; i < partnerCatDefs.length; i++) {
    const [row] = db
      .insert(tablePartnerCategories)
      .values({ ...partnerCatDefs[i], order_index: i })
      .returning()
      .all()
    if (row) partnerCatIds.push(row.id)
  }
  created.partner_categories = partnerCatIds.length

  const channelIds = db.select({ id: tableChannels.id }).from(tableChannels).all().map((r) => r.id)
  let partnerCount = 0
  for (let i = 0; i < PARTNER_NAMES.length; i++) {
    const related = channelIds.slice(0, Math.min(3, channelIds.length))
    db.insert(tablePartners)
      .values({
        category_id: partnerCatIds[i % partnerCatIds.length] ?? null,
        name: PARTNER_NAMES[i].trim(),
        logo_url: null,
        title_ru: `${PARTNER_NAMES[i].trim()} — кейс`,
        title_en: `${PARTNER_NAMES[i].trim()} case`,
        short_description_ru: `Демо-описание кейса «${PARTNER_NAMES[i].trim()}» на русском.`,
        short_description_en: `Demo case description for “${PARTNER_NAMES[i].trim()}” in English.`,
        published_at: new Date(Date.now() - i * 86400000 * 12).toISOString().slice(0, 10),
        wishlists: 1000 + i * 450,
        views: 5000 + i * 1200,
        target_url: `https://example.com/games/demo-${i + 1}`,
        developer_url: `https://example.com/dev/demo-${i + 1}`,
        steam_game_url: `https://store.steampowered.com/app/${100000 + i}/`,
        show_in_landing_cases: true,
        show_in_affiliate_cases: true,
        show_in_affiliate_steam: i % 2 === 0,
        show_wishlists: true,
        show_views: true,
        case_gallery: null,
        show_logo_on_case_detail: true,
        related_channel_ids: JSON.stringify(related),
        order_index: i,
      })
      .run()
    partnerCount += 1
  }
  created.partners = partnerCount

  const iconKey = await uploadContactIconFile(DEMO_PNG, "image/png")
  const [icon] = db
    .insert(tableContactIcons)
    .values({
      name: "Demo Telegram",
      s3_key: iconKey,
      filter_light: serializeIconFilters(DEFAULT_ICON_FILTERS),
      filter_dark: null,
      order_index: 0,
    })
    .returning()
    .all()
  created.contact_icons = 1

  const iconKey2 = await uploadContactIconFile(DEMO_PNG, "image/png")
  const [iconMail] = db
    .insert(tableContactIcons)
    .values({
      name: "Demo Email",
      s3_key: iconKey2,
      filter_light: serializeIconFilters(DEFAULT_ICON_FILTERS),
      filter_dark: null,
      order_index: 1,
    })
    .returning()
    .all()
  created.contact_icons = 2

  for (const scope of ["landing", "affiliate"] as const) {
    db.insert(tableContacts)
      .values({
        scope,
        email: "demo@rythm-group.test",
        telegram_url: "https://t.me/RythmGroup",
        telegram_username: "@RythmGroup",
        direct_contacts: JSON.stringify([
          {
            id: `${scope}-tg`,
            url: "https://t.me/RythmGroup",
            type: "telegram",
            icon_id: icon?.id ?? null,
            filter_light: null,
            filter_dark: null,
            label_ru: "Telegram",
            label_en: "Telegram",
            description_ru: "@RythmGroup",
            description_en: "@RythmGroup",
          },
          {
            id: `${scope}-mail`,
            url: "mailto:demo@rythm-group.test",
            type: "email",
            icon_id: iconMail?.id ?? null,
            filter_light: null,
            filter_dark: null,
            label_ru: "Email",
            label_en: "Email",
            description_ru: "demo@rythm-group.test",
            description_en: "demo@rythm-group.test",
          },
        ]),
        mini_stats: JSON.stringify([
          {
            id: "fastResponse",
            value: "24/7",
            label_ru: "Быстрый ответ",
            label_en: "Fast response",
          },
          { id: "support", value: "< 1h", label_ru: "Поддержка", label_en: "Support" },
        ]),
      })
      .run()
  }
  created.contacts = 2

  db.insert(tableAffiliateHero)
    .values({
      badge_ru: "Демо · партнёрства",
      badge_en: "Demo · partnerships",
      title_ru: "Продвижение игр — демо-контент",
      title_en: "Game promotion — demo content",
      subtitle_ru: "Это тестовые данные. Можно безопасно перегенерировать из настроек.",
      subtitle_en: "This is demo content. Safe to regenerate from settings.",
      cta_primary_ru: "Оставить заявку",
      cta_primary_en: "Apply",
      cta_secondary_ru: "Смотреть кейсы",
      cta_secondary_en: "View cases",
    })
    .run()
  created.affiliate_hero = 1

  const formats = [
    {
      title_ru: "Вишлисты Steam",
      title_en: "Steam wishlists",
      body_ru: "Демо-формат: фокус на добавления в вишлист.",
      body_en: "Demo format: focus on wishlist adds.",
    },
    {
      title_ru: "Интеграции",
      title_en: "Integrations",
      body_ru: "Демо-формат: интеграции в Telegram-каналах.",
      body_en: "Demo format: Telegram channel integrations.",
    },
    {
      title_ru: "Релизы",
      title_en: "Launches",
      body_ru: "Демо-формат: поддержка релиза.",
      body_en: "Demo format: launch support.",
    },
    {
      title_ru: "Аналитика",
      title_en: "Analytics",
      body_ru: "Демо-формат: отчёты и метрики.",
      body_en: "Demo format: reports and metrics.",
    },
  ]
  formats.forEach((f, i) => {
    db.insert(tableAffiliateFormats)
      .values({ ...f, hidden: false, order_index: i })
      .run()
  })
  created.affiliate_formats = formats.length

  const faqs = [
    {
      question_ru: "Это демо-данные?",
      question_en: "Is this demo data?",
      answer_ru: "Да. Контент можно сбросить кнопкой в настройках сайта.",
      answer_en: "Yes. Content can be reset from site settings.",
    },
    {
      question_ru: "Сохраняется ли логотип?",
      question_en: "Is the logo kept?",
      answer_ru: "Да, поле логотипа при демо-сиде не затирается.",
      answer_en: "Yes, the logo field is preserved during demo seed.",
    },
    {
      question_ru: "Нужен ли S3?",
      question_en: "Is S3 required?",
      answer_ru: "Да, для очистки медиа и демо-иконок контактов.",
      answer_en: "Yes, for media cleanup and demo contact icons.",
    },
    {
      question_ru: "Сколько кейсов в демо?",
      question_en: "How many cases in the demo?",
      answer_ru: "Около шести партнёрских кейсов.",
      answer_en: "About six partner cases.",
    },
  ]
  faqs.forEach((f, i) => {
    db.insert(tableAffiliateFaq)
      .values({ ...f, hidden: false, order_index: i })
      .run()
  })
  created.affiliate_faq = faqs.length

  const about = [
    {
      icon: "Target",
      title_ru: "Фокус на GameDev",
      title_en: "GameDev focus",
      text_ru: "Демо-карточка: работаем с инди и AA.",
      text_en: "Demo card: we work with indie and AA.",
    },
    {
      icon: "BarChart3",
      title_ru: "Прозрачная статистика",
      title_en: "Clear stats",
      text_ru: "Демо-карточка: метрики по кампаниям.",
      text_en: "Demo card: campaign metrics.",
    },
    {
      icon: "Handshake",
      title_ru: "Партнёрства",
      title_en: "Partnerships",
      text_ru: "Демо-карточка: долгосрочные коллаборации.",
      text_en: "Demo card: long-term collaborations.",
    },
    {
      icon: "Megaphone",
      title_ru: "Медиасеть",
      title_en: "Media network",
      text_ru: "Демо-карточка: каналы и охваты.",
      text_en: "Demo card: channels and reach.",
    },
  ]
  about.forEach((card, i) => {
    db.insert(tableAboutCards)
      .values({
        ...card,
        icon_image: null,
        hidden: false,
        order_index: i,
      })
      .run()
  })
  created.about_cards = about.length

  const blogCats = [
    { slug: "news", name_ru: "Новости", name_en: "News" },
    { slug: "cases", name_ru: "Кейсы", name_en: "Cases" },
    { slug: "guides", name_ru: "Гайды", name_en: "Guides" },
    { slug: "updates", name_ru: "Апдейты", name_en: "Updates" },
  ]
  const blogCatIds: number[] = []
  blogCats.forEach((c, i) => {
    const [row] = db
      .insert(tableBlogCategories)
      .values({ ...c, order_index: i, deleted_at: null })
      .returning()
      .all()
    if (row) blogCatIds.push(row.id)
  })
  created.blog_categories = blogCatIds.length

  const nowSec = Math.floor(Date.now() / 1000)
  let posts = 0
  for (let i = 0; i < 6; i++) {
    const catId = blogCatIds[i % blogCatIds.length]
    if (catId == null) continue
    db.insert(tableBlogPosts)
      .values({
        category_id: catId,
        slug: `demo-post-${i + 1}`,
        title_ru: `Демо-статья ${i + 1}`,
        title_en: `Demo post ${i + 1}`,
        excerpt_ru: `Краткое демо-описание статьи ${i + 1}.`,
        excerpt_en: `Short demo excerpt for post ${i + 1}.`,
        body_html_ru: `<p>Это <strong>демо</strong> текст статьи ${i + 1} на русском.</p>`,
        body_html_en: `<p>This is <strong>demo</strong> post ${i + 1} body in English.</p>`,
        cover_image_url: null,
        status: i === 5 ? "draft" : "published",
        published_at: nowSec - i * 86400,
        deleted_at: null,
      })
      .run()
    posts += 1
  }
  created.blog_posts = posts

  return created
}

export function plannedCreateCounts(): Record<string, number> {
  return {
    channel_categories: CHANNEL_CATS.length,
    channels: CHANNEL_NAMES.length,
    partner_categories: 4,
    partners: PARTNER_NAMES.length,
    contact_icons: 2,
    contacts: 2,
    affiliate_hero: 1,
    affiliate_formats: 4,
    affiliate_faq: 4,
    about_cards: 4,
    blog_categories: 4,
    blog_posts: 6,
    translations: -1, // из fallbackTranslations, точное число при execute
  }
}
