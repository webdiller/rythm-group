import { AffiliateHero } from "@/components/affiliate/affiliate-hero"
import { AffiliateCooperationFormats } from "@/components/affiliate/affiliate-cooperation-formats"
import { AffiliateCasesGrid } from "@/components/affiliate/affiliate-cases-grid"
import { AffiliateSteamSection } from "@/components/affiliate/affiliate-steam-section"
import { AffiliateFaq } from "@/components/affiliate/affiliate-faq"
import { ContactForm } from "@/components/contact-form"
import type { Partner, PartnerCategory } from "@/components/cases"
import { notFound } from "next/navigation"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"
import { ServicePartnerCategories } from "@/lib/services/partner-categories"
import { ServicePartners } from "@/lib/services/partners"
import { ServiceAffiliateHero } from "@/lib/services/affiliate-hero"
import { ServiceAffiliateFormats } from "@/lib/services/affiliate-formats"
import { ServiceAffiliateFaq } from "@/lib/services/affiliate-faq"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { resolveBackgroundSrc } from "@/lib/server/site-backgrounds"

type AffiliateSettings = {
	affiliate_show_hero?: boolean | null
	affiliate_show_formats?: boolean | null
	affiliate_show_cases?: boolean | null
	affiliate_show_steam?: boolean | null
	affiliate_show_faq?: boolean | null
	affiliate_show_contacts?: boolean | null
	heroAnimationEnabled?: boolean | null
	affiliate_contact_layout?: "formFirst" | "contactsFirst" | null
	affiliate_contact_form_hidden?: boolean | null
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

function getAffiliateData(): {
	partnerCategories: PartnerCategory[]
	partners: Partner[]
	settings: AffiliateSettings
	hero: AffiliateHeroRecord | null
	formats: AffiliateFormatRecord[]
	faq: AffiliateFaqRecord[]
} {
	const partnerCategories = [...(ServicePartnerCategories.getAll().data ?? [])].map((c) => ({ ...c, order_index: c.order_index ?? 0 })).sort((a, b) => a.order_index - b.order_index) as PartnerCategory[]
	const partners = (ServicePartners.getAll().data ?? []) as Partner[]
	const db = getDb()
	const settings = (db.select().from(tableSiteSettings).limit(1).all()[0] ?? {}) as AffiliateSettings
	const hero = (ServiceAffiliateHero.getOne().data ?? null) as AffiliateHeroRecord | null
	const formats = [...(ServiceAffiliateFormats.getAll().data ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) as AffiliateFormatRecord[]
	const faq = [...(ServiceAffiliateFaq.getAll().data ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) as AffiliateFaqRecord[]

	return {
		partnerCategories,
		partners,
		settings,
		hero,
		formats,
		faq,
	}
}

export default async function AffiliatePage() {
	const { pageAffiliateEnabled } = getPageVisibilityFlags()
	if (!pageAffiliateEnabled) notFound()

	const { partnerCategories, partners, settings, hero, formats, faq } = getAffiliateData()
	const animationsEnabled = settings.heroAnimationEnabled ?? true
	const contactLayout = settings.affiliate_contact_layout ?? "formFirst"
	const contactFormHidden = settings.affiliate_contact_form_hidden ?? false
	const showFormatsSection = settings.affiliate_show_formats ?? true
	const heroBgLight = resolveBackgroundSrc("hero", "light", "affiliate")
	const heroBgDark = resolveBackgroundSrc("hero", "dark", "affiliate")

	return (
		<>
			{(settings.affiliate_show_hero ?? true) ? (
				<AffiliateHero
					data={hero}
					enableAffiliateCooperationFormats={showFormatsSection}
					backgroundLightSrc={heroBgLight}
					backgroundDarkSrc={heroBgDark}
				/>
			) : null}
			{showFormatsSection ? <AffiliateCooperationFormats items={formats} /> : null}
			{(settings.affiliate_show_cases ?? true) ? (
				<AffiliateCasesGrid
					categories={partnerCategories}
					partners={partners}
				/>
			) : null}
			{(settings.affiliate_show_steam ?? true) ? <AffiliateSteamSection partners={partners} /> : null}
			{(settings.affiliate_show_faq ?? true) ? <AffiliateFaq items={faq} /> : null}
			{(settings.affiliate_show_contacts ?? true) ? (
				<ContactForm
					animationsEnabled={animationsEnabled}
					layout={contactLayout}
					hideForm={contactFormHidden}
					scope="affiliate"
				/>
			) : null}
		</>
	)
}
