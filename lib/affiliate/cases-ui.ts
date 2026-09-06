export type LandingPartnerCategory = {
  id: number
  name: string
  name_ru: string
  name_en: string
  order_index: number
}

export type LandingPartner = {
  id: number
  category_id: number | null
  name: string
  logo_url: string | null
  title_ru?: string | null
  title_en?: string | null
  short_description_ru?: string | null
  short_description_en?: string | null
  published_at?: string | null
  wishlists?: number | null
  views?: number | null
  target_url?: string | null
  developer_url?: string | null
  steam_game_url?: string | null
  show_in_affiliate_cases?: boolean | null
  show_in_affiliate_steam?: boolean | null
  order_index: number
}

export type AffiliateCaseCardUi = {
  id: number
  slug: string
  title: string
  coverImage: string
  publishedAt: string
  wishlists: number
}

export type AffiliateCaseDetailUi = {
  id: number
  slug: string
  title: string
  title_ru: string
  title_en: string
  coverImage: string
  category_ru: string
  category_en: string
  shortDescription_ru: string
  shortDescription_en: string
  wishlists: number
  views: number
  publishedAt: string
  steamGameUrl: string | null
}

export function buildAffiliateCaseSlug(partner: Pick<LandingPartner, "id" | "name">): string {
  return `${partner.id}-${slugify(partner.name)}`
}

export function parseAffiliateCaseIdFromSlug(slug: string): number | null {
  const idPart = slug.split("-")[0]
  const parsed = Number.parseInt(idPart ?? "", 10)
  return Number.isFinite(parsed) ? parsed : null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generatedPublishedAt(id: number): string {
  const month = (id % 12) + 1
  const day = (id % 25) + 1
  return `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function generatedWishlists(id: number): number {
  return 2500 + ((id * 431) % 18000)
}

function generatedViews(id: number): number {
  return 1200 + ((id * 173) % 95000)
}

export function mapPartnerToAffiliateCaseCard(partner: LandingPartner): AffiliateCaseCardUi {
  const hasLogo = Boolean(partner.logo_url && partner.logo_url.trim())
  return {
    id: partner.id,
    slug: buildAffiliateCaseSlug(partner),
    title: partner.title_ru ?? partner.name,
    coverImage: hasLogo ? `/api/content/partners/${partner.id}/logo` : "",
    publishedAt: partner.published_at ?? generatedPublishedAt(partner.id),
    wishlists: partner.wishlists ?? generatedWishlists(partner.id),
  }
}

export function mapPartnerToAffiliateCaseDetail(
  partner: LandingPartner,
  categories: LandingPartnerCategory[],
): AffiliateCaseDetailUi {
  const category = categories.find((item) => item.id === partner.category_id) ?? null
  const hasLogo = Boolean(partner.logo_url && partner.logo_url.trim())

  return {
    id: partner.id,
    slug: buildAffiliateCaseSlug(partner),
    title: partner.title_ru ?? partner.name,
    title_ru: partner.title_ru ?? partner.name,
    title_en: partner.title_en ?? partner.name,
    coverImage: hasLogo ? `/api/content/partners/${partner.id}/logo` : "",
    category_ru: category?.name_ru ?? "Без категории",
    category_en: category?.name_en ?? "Uncategorized",
    shortDescription_ru: partner.short_description_ru ?? "",
    shortDescription_en: partner.short_description_en ?? "",
    wishlists: partner.wishlists ?? generatedWishlists(partner.id),
    views: partner.views ?? generatedViews(partner.id),
    publishedAt: partner.published_at ?? generatedPublishedAt(partner.id),
    steamGameUrl: partner.steam_game_url?.trim() || null,
  }
}
