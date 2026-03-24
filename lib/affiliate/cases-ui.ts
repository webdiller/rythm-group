import { AFFILIATE_CASES_MOCK } from "@/lib/affiliate/mock-data"

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
  coverImage: string
  category_ru: string
  category_en: string
  shortDescription_ru: string
  shortDescription_en: string
  wishlists: number
  views: number
  publishedAt: string
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

function getMockById(id: number) {
  return AFFILIATE_CASES_MOCK[id % AFFILIATE_CASES_MOCK.length]
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
  const mock = getMockById(partner.id)
  return {
    id: partner.id,
    slug: buildAffiliateCaseSlug(partner),
    title: partner.name,
    coverImage: mock.coverImage,
    publishedAt: generatedPublishedAt(partner.id),
    wishlists: generatedWishlists(partner.id),
  }
}

export function mapPartnerToAffiliateCaseDetail(
  partner: LandingPartner,
  categories: LandingPartnerCategory[],
): AffiliateCaseDetailUi {
  const mock = getMockById(partner.id)
  const category = categories.find((item) => item.id === partner.category_id) ?? null

  return {
    id: partner.id,
    slug: buildAffiliateCaseSlug(partner),
    title: partner.name,
    coverImage: mock.coverImage,
    category_ru: category?.name_ru ?? "Без категории",
    category_en: category?.name_en ?? "Uncategorized",
    shortDescription_ru: mock.shortDescription_ru,
    shortDescription_en: mock.shortDescription_en,
    wishlists: generatedWishlists(partner.id),
    views: generatedViews(partner.id),
    publishedAt: generatedPublishedAt(partner.id),
  }
}
