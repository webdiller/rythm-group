import { AffiliateHero } from "@/components/affiliate/affiliate-hero"
import { AffiliateCooperationFormats } from "@/components/affiliate/affiliate-cooperation-formats"
import { AffiliateMiniBlog } from "@/components/affiliate/affiliate-mini-blog"
import { AffiliateCasesGrid } from "@/components/affiliate/affiliate-cases-grid"
import { AffiliateSteamSection } from "@/components/affiliate/affiliate-steam-section"
import { AffiliateFaq } from "@/components/affiliate/affiliate-faq"
import { AFFILIATE_UI_MOCK } from "@/lib/affiliate/mock-data"

export default function AffiliatePage() {
  const u = AFFILIATE_UI_MOCK

  return (
    <>
      {u.showHero ? <AffiliateHero /> : null}
      {u.showCooperationFormats ? <AffiliateCooperationFormats /> : null}
      {/* {u.showMiniBlog ? <AffiliateMiniBlog /> : null}
      {u.showCases ? <AffiliateCasesGrid /> : null}
      {u.showSteam ? <AffiliateSteamSection /> : null} */}
      {u.showFaq ? <AffiliateFaq /> : null}
    </>
  )
}
