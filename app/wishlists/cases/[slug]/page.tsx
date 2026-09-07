export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { AffiliateCaseDetail } from "@/components/affiliate/affiliate-case-detail"
import type { Partner, PartnerCategory } from "@/components/cases"
import {
  mapPartnerToAffiliateCaseDetail,
  parseAffiliateCaseIdFromSlug,
} from "@/lib/affiliate/cases-ui"
import type { Metadata } from "next"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"
import { ServicePartnerCategories } from "@/lib/services/partner-categories"
import { ServicePartners } from "@/lib/services/partners"

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return []
}

function getAffiliateCaseData() {
  return {
    categories: (ServicePartnerCategories.getAll().data ?? []) as PartnerCategory[],
    partners: (ServicePartners.getAll().data ?? []) as Partner[],
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { categories, partners } = getAffiliateCaseData()
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
  const { categories, partners } = getAffiliateCaseData()
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
