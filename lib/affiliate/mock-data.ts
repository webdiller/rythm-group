/**
 * Моковые данные для UI модуля Affiliate (без БД).
 * Флаги видимости блоков имитируют будущие настройки из админки.
 */

export type AffiliateUiMock = {
  showHero: boolean
  showCooperationFormats: boolean
  showMiniBlog: boolean
  showCases: boolean
  showSteam: boolean
  showFaq: boolean
  /** Как blog_show_dates: даты в ленте мини-блога */
  showPostDates: boolean
}

export const AFFILIATE_UI_MOCK: AffiliateUiMock = {
  showHero: true,
  showCooperationFormats: true,
  showMiniBlog: true,
  showCases: true,
  showSteam: true,
  showFaq: true,
  showPostDates: true,
}

export type CooperationFormatMock = {
  id: string
  title_ru: string
  title_en: string
  body_ru: string
  body_en: string
  /** Неактуальные скрываем (как в админке) */
  hidden: boolean
}

export const COOPERATION_FORMATS_MOCK: CooperationFormatMock[] = [
  {
    id: "wishlists",
    title_ru: "Вишлисты Steam",
    title_en: "Steam wishlists",
    body_ru:
      "Продвижение игры через нашу сеть каналов с фокусом на добавления в вишлист: охват целевой аудитории, понятные сроки и отчётность по метрикам.",
    body_en:
      "Promotion through our channel network focused on wishlist adds: reach for the right audience, clear timelines, and reporting on key metrics.",
    hidden: false,
  },
  {
    id: "ads",
    title_ru: "Рекламный формат",
    title_en: "Advertising",
    body_ru:
      "Размещение нативных и рекламных интеграций в Telegram: креатив, согласование, публикации и базовая аналитика по охватам и вовлечению.",
    body_en:
      "Native and ad integrations in Telegram: creative, approvals, publishing, and baseline analytics on reach and engagement.",
    hidden: false,
  },
  {
    id: "revshare",
    title_ru: "Процент с продаж",
    title_en: "Revenue share",
    body_ru:
      "Модель для крупных издателей и студий: совместное продвижение и прозрачное распределение выручки по согласованным правилам.",
    body_en:
      "For larger publishers and studios: joint promotion and transparent revenue sharing under agreed rules.",
    hidden: false,
  },
  {
    id: "full",
    title_ru: "Полное продвижение (фикс)",
    title_en: "Full promotion (fixed)",
    body_ru:
      "Берём на себя весь цикл продвижения под фиксированную стоимость: стратегия, контент, публикации и сопровождение до результата.",
    body_en:
      "We take the full promotion cycle for a fixed fee: strategy, content, publishing, and support through to results.",
    hidden: false,
  },
]

export type AffiliateCaseSocialShot = {
  image: string
  reactions: string
  views: string
}

export type AffiliateCaseMock = {
  slug: string
  gameTitle_ru: string
  gameTitle_en: string
  coverImage: string
  publishedAt: string
  wishlists: string
  shortDescription_ru: string
  shortDescription_en: string
  socialScreens: AffiliateCaseSocialShot[]
  timeline_ru: string
  timeline_en: string
  statsScreenshot: string
  hidden: boolean
}

export const AFFILIATE_CASES_MOCK: AffiliateCaseMock[] = [
  {
    slug: "neon-drift",
    gameTitle_ru: "Neon Drift",
    gameTitle_en: "Neon Drift",
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    publishedAt: "2024-11-12",
    wishlists: "12 400",
    shortDescription_ru:
      "Аркадный раннер в неоновом киберпанке. Кампания с упором на вишлист и демо на фестивале.",
    shortDescription_en:
      "Arcade runner in neon cyberpunk. Campaign focused on wishlists and a festival demo.",
    socialScreens: [
      {
        image: "https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=600&q=80",
        reactions: "1.2k",
        views: "48k",
      },
      {
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&q=80",
        reactions: "890",
        views: "31k",
      },
    ],
    timeline_ru:
      "За 14 дней собрали основной объём вишлистов после серии постов и коллабораций с тематическими каналами.",
    timeline_en:
      "Collected the bulk of wishlists within 14 days after a series of posts and collabs with themed channels.",
    statsScreenshot: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
    hidden: false,
  },
  {
    slug: "vault-keepers",
    gameTitle_ru: "Vault Keepers",
    gameTitle_en: "Vault Keepers",
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80",
    publishedAt: "2025-01-08",
    wishlists: "8 200",
    shortDescription_ru:
      "Кооперативный экшен. Подчеркнули социальные доказательства: скриншоты отзывов и ретweets из X.",
    shortDescription_en:
      "Co-op action. We highlighted social proof: review screenshots and retweets from X.",
    socialScreens: [
      {
        image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600&q=80",
        reactions: "2.1k",
        views: "72k",
      },
    ],
    timeline_ru: "Пик вишлистов пришёлся на первую неделю после анонса трейлера.",
    timeline_en: "Wishlist peak came in the first week after the trailer announcement.",
    statsScreenshot: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
    hidden: false,
  },
]

export type SteamPublisherMock = {
  id: string
  name_ru: string
  name_en: string
  image: string
  steamUrl: string
  hidden: boolean
}

export const STEAM_PUBLISHERS_MOCK: SteamPublisherMock[] = [
  {
    id: "p1",
    name_ru: "Indie Forge Studio",
    name_en: "Indie Forge Studio",
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400&q=80",
    steamUrl: "https://store.steampowered.com/developer/valve",
    hidden: false,
  },
  {
    id: "p2",
    name_ru: "Pixel Tales",
    name_en: "Pixel Tales",
    image: "https://images.unsplash.com/photo-1556438494-192d6e3d7c2d?w=400&q=80",
    steamUrl: "https://store.steampowered.com/publisher/facepunchstudios",
    hidden: false,
  },
]

export type AffiliateFaqMock = {
  id: string
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  sort_order: number
}

export const AFFILIATE_FAQ_MOCK: AffiliateFaqMock[] = [
  {
    id: "faq1",
    question_ru: "Нужна ли предоплата?",
    question_en: "Is a prepayment required?",
    answer_ru:
      "Условия зависят от формата: для стандартных пакетов часто используем предоплату 30–50%, для крупных контрактов — по договорённости.",
    answer_en:
      "Terms depend on the format: standard packages often use 30–50% prepayment; larger contracts are agreed individually.",
    sort_order: 0,
  },
  {
    id: "faq2",
    question_ru: "За сколько дней выходят посты?",
    question_en: "How soon do posts go live?",
    answer_ru:
      "После согласования креатива и слота — обычно 3–7 рабочих дней. Срочные размещения обсуждаются отдельно.",
    answer_en:
      "After creative and slot approval — typically 3–7 business days. Rush placements are discussed separately.",
    sort_order: 1,
  },
  {
    id: "faq3",
    question_ru: "Как проходит оплата?",
    question_en: "How does payment work?",
    answer_ru:
      "Безнал для юрлиц по счёту; для международных партнёров — по договору и инвойсу. Детали фиксируем до старта кампании.",
    answer_en:
      "Wire for legal entities via invoice; for international partners — per contract and invoice. Details are fixed before launch.",
    sort_order: 2,
  },
]

export type AffiliateMiniPostMock = {
  id: string
  category_ru: string
  category_en: string
  title_ru: string
  title_en: string
  excerpt_ru: string
  excerpt_en: string
  cover_image_url: string | null
  published_at: string
}

export function getAffiliateCaseBySlug(slug: string): AffiliateCaseMock | undefined {
  const c = AFFILIATE_CASES_MOCK.find((x) => x.slug === slug)
  if (!c || c.hidden) return undefined
  return c
}

export const AFFILIATE_MINI_BLOG_MOCK: AffiliateMiniPostMock[] = [
  {
    id: "m1",
    category_ru: "Кейсы",
    category_en: "Cases",
    title_ru: "Как мы собирали вишлисты за две недели",
    title_en: "How we built wishlists in two weeks",
    excerpt_ru: "Разбор метрик, тайминга постов и работы с комьюнити.",
    excerpt_en: "Metrics, post timing, and community work — a short breakdown.",
    cover_image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80",
    published_at: "2025-02-01",
  },
  {
    id: "m2",
    category_ru: "Статистика",
    category_en: "Statistics",
    title_ru: "Охваты vs конверсия в Telegram",
    title_en: "Reach vs conversion in Telegram",
    excerpt_ru: "Что смотреть в отчётах, если цель — вишлист, а не только просмотры.",
    excerpt_en: "What to track when the goal is wishlists, not only views.",
    cover_image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    published_at: "2025-01-20",
  },
  {
    id: "m3",
    category_ru: "Новости",
    category_en: "News",
    title_ru: "Новые слоты для инди в марте",
    title_en: "New indie slots in March",
    excerpt_ru: "Открыли дополнительные окна для нативных интеграций.",
    excerpt_en: "Additional windows opened for native integrations.",
    cover_image_url: null,
    published_at: "2025-01-05",
  },
]
