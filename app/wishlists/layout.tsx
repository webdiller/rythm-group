import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Header } from "@/components/header"
import { Footer, type SiteSettings } from "@/components/footer"
import { normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { hasGlobalBackgroundThemes } from "@/lib/server/global-backgrounds"
import { resolveBackgroundSrc } from "@/lib/server/site-backgrounds"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
	title: "Вишлисты — Rythm Group",
	description: "Партнерская программа Rythm Group: форматы сотрудничества, кейсы и контакты.",
}

async function getAffiliateShellMeta(): Promise<{
	siteSettings: SiteSettings | null
	hasCustomGlobalBackgroundForBothThemes: boolean
	headerNavOrder: HeaderNavItemId[]
	globalBgLight: string
	globalBgDark: string
}> {
	const db = getDb()
	const siteSettings = (db.select().from(tableSiteSettings).limit(1).all()[0] ?? null) as SiteSettings | null

	let headerNavOrder: HeaderNavItemId[] = normalizeHeaderNavOrder(undefined)
	try {
		headerNavOrder = normalizeHeaderNavOrder(siteSettings?.headerNavOrder ? JSON.parse(siteSettings.headerNavOrder) : undefined)
	} catch {
		headerNavOrder = normalizeHeaderNavOrder(undefined)
	}

	const bg = await hasGlobalBackgroundThemes("affiliate")

	return {
		siteSettings,
		hasCustomGlobalBackgroundForBothThemes: bg.both,
		headerNavOrder,
		globalBgLight: resolveBackgroundSrc("global", "light", "affiliate"),
		globalBgDark: resolveBackgroundSrc("global", "dark", "affiliate"),
	}
}

export default async function AffiliateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	const { pageAffiliateEnabled, pageBlogEnabled } = getPageVisibilityFlags()
	if (!pageAffiliateEnabled) notFound()

	const { siteSettings, hasCustomGlobalBackgroundForBothThemes, headerNavOrder, globalBgLight, globalBgDark } = await getAffiliateShellMeta()

	return (
		<div className="relative min-h-screen w-full">
			<div
				className="absolute inset-0 z-0"
				aria-hidden="true"
			>
				<div
					className="absolute inset-0 bg-cover bg-center bg-fixed dark:hidden"
					style={{ backgroundImage: `url('${globalBgLight}')` }}
				/>
				<div
					className="absolute inset-0 hidden bg-cover bg-center bg-fixed dark:block"
					style={{ backgroundImage: `url('${globalBgDark}')` }}
				/>
			</div>
			{!hasCustomGlobalBackgroundForBothThemes && (
				<>
					<div className="absolute inset-0 z-10 radial-gradient-bg" />
					<div
						className="absolute inset-0 z-10 opacity-60"
						style={{
							background: "radial-gradient(100% 100% at 80% 20%, rgba(230, 27, 0, 0.08) 0%, transparent 50%)",
						}}
					/>
				</>
			)}

			<div className="relative z-20">
				<Header
					sectionHrefPrefix="/"
					navOrder={headerNavOrder}
					logoText={siteSettings?.logo_text ?? null}
					logo={siteSettings?.logo ?? null}
					pageBlogEnabled={pageBlogEnabled}
					pageAffiliateEnabled={pageAffiliateEnabled}
				/>
				<main>{children}</main>
				<Footer
					siteSettings={siteSettings}
					sectionHrefPrefix="/"
					pageBlogEnabled={pageBlogEnabled}
					pageAffiliateEnabled={pageAffiliateEnabled}
				/>
			</div>
		</div>
	)
}
