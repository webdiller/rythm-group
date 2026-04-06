import { AffiliateHero } from "@/components/affiliate/affiliate-hero"
import { AffiliateCooperationFormats } from "@/components/affiliate/affiliate-cooperation-formats"
import { AffiliateCasesGrid } from "@/components/affiliate/affiliate-cases-grid"
import { AffiliateSteamSection } from "@/components/affiliate/affiliate-steam-section"
import { AffiliateFaq } from "@/components/affiliate/affiliate-faq"
import { ContactForm } from "@/components/contact-form"
import type { Partner, PartnerCategory } from "@/components/cases"
import { getSiteBaseUrl } from "@/lib/site-url"

type AffiliateSettings = {
  affiliate_show_hero?: boolean | null
  affiliate_show_formats?: boolean | null
  affiliate_show_cases?: boolean | null
  affiliate_show_steam?: boolean | null
  affiliate_show_faq?: boolean | null
  heroAnimationEnabled?: boolean | null
  contactLayout?: "formFirst" | "contactsFirst" | null
  contactFormHidden?: boolean | null
}

type AffiliateHeroRecord = {
  badge_ru: string
  badge_en: string
  title_ru: string
  title_en: string
  subtitle_ru: string
  subtitle_en: string
  cta_primary_ru: string
  cta_primary_en: string
  cta_secondary_ru: string
  cta_secondary_en: string
}

type AffiliateFormatRecord = {
  id: number
  title_ru: string
  title_en: string
  body_ru: string
  body_en: string
  hidden: boolean | null
  order_index?: number | null
}

type AffiliateFaqRecord = {
  id: number
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  hidden: boolean | null
  order_index: number | null
}

async function getAffiliateData(): Promise<{
  partnerCategories: PartnerCategory[]
  partners: Partner[]
  settings: AffiliateSettings
  hero: AffiliateHeroRecord | null
  formats: AffiliateFormatRecord[]
  faq: AffiliateFaqRecord[]
}> {
  const baseUrl = getSiteBaseUrl()
  const [partnerCatRes, partnerRes, settingsRes, heroRes, formatsRes, faqRes] = await Promise.all([
    fetch(`${baseUrl}/api/content/partner-categories`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/partners`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/site/settings`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/affiliate-hero`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/affiliate-formats`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/content/affiliate-faq`, { cache: "no-store" }),
  ])

  const partnerCategoriesJson = (await partnerCatRes.json()) as { data?: PartnerCategory[] }
  const partnersJson = (await partnerRes.json()) as { data?: Partner[] }
  const settingsJson = (await settingsRes.json()) as { data?: AffiliateSettings | null }
  const heroJson = (await heroRes.json()) as { data?: AffiliateHeroRecord | null }
  const formatsJson = (await formatsRes.json()) as { data?: AffiliateFormatRecord[] }
  const faqJson = (await faqRes.json()) as { data?: AffiliateFaqRecord[] }

  return {
    partnerCategories: (partnerCategoriesJson.data ?? []).sort((a, b) => a.order_index - b.order_index),
    partners: partnersJson.data ?? [],
    settings: settingsJson.data ?? {},
    hero: heroJson.data ?? null,
    formats: (formatsJson.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
    faq: (faqJson.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
  }
}

export default async function AffiliatePage() {
  const { partnerCategories, partners, settings, hero, formats, faq } = await getAffiliateData()
  const animationsEnabled = settings.heroAnimationEnabled ?? true
  const contactLayout = settings.contactLayout ?? "formFirst"
  const contactFormHidden = settings.contactFormHidden ?? false
  const showFormatsSection = settings.affiliate_show_formats ?? true

  return (
    <>
      {settings.affiliate_show_hero ?? true ? (
        <AffiliateHero
          data={hero}
          enableAffiliateCooperationFormats={showFormatsSection}
        />
      ) : null}
      {showFormatsSection ? <AffiliateCooperationFormats items={formats} /> : null}
      {settings.affiliate_show_cases ?? true ? <AffiliateCasesGrid categories={partnerCategories} partners={partners} /> : null}
      {settings.affiliate_show_steam ?? true ? <AffiliateSteamSection partners={partners} /> : null}
      {settings.affiliate_show_faq ?? true ? <AffiliateFaq items={faq} /> : null}
      <ContactForm
        animationsEnabled={animationsEnabled}
        layout={contactLayout}
        hideForm={contactFormHidden}
      />
    </>
  )
}
