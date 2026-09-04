export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { AffiliateCaseDetail } from "@/components/affiliate/affiliate-case-detail"
import type { Partner, PartnerCategory } from "@/components/cases"
import {
  mapPartnerToAffiliateCaseDetail,
  parseAffiliateCaseIdFromSlug,
} from "@/lib/affiliate/cases-ui"
import type { Metadata } from "next"
import { getSiteBaseUrl } from "@/lib/site-url"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return []
}

async function getAffiliateCaseData() {
  const baseUrl = getSiteBaseUrl()
  const [partnerCatRes, partnerRes] = await Promise.all([
    fetch(`${baseUrl}/api/content/partner-categories`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/partners`, { cache: "no-store" }),
  ])

  const partnerCategoriesJson = (await partnerCatRes.json()) as { data?: PartnerCategory[] }
  const partnersJson = (await partnerRes.json()) as { data?: Partner[] }

  return {
    categories: partnerCategoriesJson.data ?? [],
    partners: partnersJson.data ?? [],
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { categories, partners } = await getAffiliateCaseData()
  const caseId = parseAffiliateCaseIdFromSlug(slug)
  const partner = partners.find((x) => x.id === caseId)
  if (!partner) return { title: "Кейс | Rythm Group" }
  const c = mapPartnerToAffiliateCaseDetail(partner, categories)

  return {
    title: `${c.title} | Wishlists — Rythm Group`,
    description: c.shortDescription_ru,
  }
}

export default async function AffiliateCasePage({ params }: PageProps) {
  const { pageAffiliateEnabled } = getPageVisibilityFlags()
  if (!pageAffiliateEnabled) notFound()

  const { slug } = await params
  const { categories, partners } = await getAffiliateCaseData()
  const caseId = parseAffiliateCaseIdFromSlug(slug)
  const partner = partners.find((x) => x.id === caseId)
  const caseItem = partner ? mapPartnerToAffiliateCaseDetail(partner, categories) : null
  if (!caseItem) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <AffiliateCaseDetail caseItem={caseItem} />
    </div>
  )
}
