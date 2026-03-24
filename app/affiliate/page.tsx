import { AffiliateHero } from "@/components/affiliate/affiliate-hero"
import { AffiliateCooperationFormats } from "@/components/affiliate/affiliate-cooperation-formats"
import { AffiliateCasesGrid } from "@/components/affiliate/affiliate-cases-grid"
import { AffiliateSteamSection } from "@/components/affiliate/affiliate-steam-section"
import { AffiliateFaq } from "@/components/affiliate/affiliate-faq"
import { AFFILIATE_UI_MOCK } from "@/lib/affiliate/mock-data"
import type { Partner, PartnerCategory } from "@/components/cases"
import { getSiteBaseUrl } from "@/lib/site-url"

async function getAffiliateData(): Promise<{ partnerCategories: PartnerCategory[]; partners: Partner[] }> {
  const baseUrl = getSiteBaseUrl()
  const [partnerCatRes, partnerRes] = await Promise.all([
    fetch(`${baseUrl}/api/content/partner-categories`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/partners`, { cache: "no-store" }),
  ])

  const partnerCategoriesJson = (await partnerCatRes.json()) as { data?: PartnerCategory[] }
  const partnersJson = (await partnerRes.json()) as { data?: Partner[] }

  return {
    partnerCategories: (partnerCategoriesJson.data ?? []).sort((a, b) => a.order_index - b.order_index),
    partners: partnersJson.data ?? [],
  }
}

export default async function AffiliatePage() {
  const u = AFFILIATE_UI_MOCK
  const { partnerCategories, partners } = await getAffiliateData()

  return (
    <>
      {u.showHero ? <AffiliateHero /> : null}
      {u.showCooperationFormats ? <AffiliateCooperationFormats /> : null}
      {u.showCases ? <AffiliateCasesGrid categories={partnerCategories} partners={partners} /> : null}
      {u.showSteam ? <AffiliateSteamSection partners={partners} /> : null}
      {u.showFaq ? <AffiliateFaq /> : null}
    </>
  )
}
