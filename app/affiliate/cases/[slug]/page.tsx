import { notFound } from "next/navigation"
import { AffiliateCaseDetail } from "@/components/affiliate/affiliate-case-detail"
import { getAffiliateCaseBySlug, AFFILIATE_CASES_MOCK } from "@/lib/affiliate/mock-data"
import type { Metadata } from "next"

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return AFFILIATE_CASES_MOCK.filter((c) => !c.hidden).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const c = getAffiliateCaseBySlug(slug)
  if (!c) return { title: "Кейс | Rythm Group" }
  return {
    title: `${c.gameTitle_ru} | Affiliate — Rythm Group`,
    description: c.shortDescription_ru,
  }
}

export default async function AffiliateCasePage({ params }: PageProps) {
  const { slug } = await params
  const caseItem = getAffiliateCaseBySlug(slug)
  if (!caseItem) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-24 sm:px-6 lg:px-8">
      <AffiliateCaseDetail caseItem={caseItem} />
    </div>
  )
}
