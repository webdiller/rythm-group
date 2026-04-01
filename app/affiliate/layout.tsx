import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Footer, type SiteSettings } from "@/components/footer"
import { getAffiliateSeoFromDb } from "@/lib/affiliate/page-meta"
import { getSiteBaseUrl } from "@/lib/site-url"
import { normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = getAffiliateSeoFromDb()
  return { title, description }
}

async function getAffiliateShellMeta(): Promise<{
  siteSettings: SiteSettings | null
  hasCustomGlobalBackgroundForBothThemes: boolean
  headerNavOrder: HeaderNavItemId[]
}> {
  const baseUrl = getSiteBaseUrl()
  const [settingsRes, globalLightBgRes, globalDarkBgRes] = await Promise.all([
    fetch(`${baseUrl}/api/site/settings`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=light`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=dark`, { cache: "no-store" }),
  ])

  let siteSettings: SiteSettings | null = null
  let headerNavOrder: HeaderNavItemId[] = normalizeHeaderNavOrder(undefined)
  if (settingsRes.ok) {
    const settingsJson = (await settingsRes.json()) as { data?: SiteSettings | null }
    siteSettings = settingsJson.data ?? null
    try {
      headerNavOrder = normalizeHeaderNavOrder(
        siteSettings?.headerNavOrder ? JSON.parse(siteSettings.headerNavOrder) : undefined,
      )
    } catch {
      headerNavOrder = normalizeHeaderNavOrder(undefined)
    }
  }

  const hasCustomGlobalBackgroundForBothThemes = globalLightBgRes.ok && globalDarkBgRes.ok

  return {
    siteSettings,
    hasCustomGlobalBackgroundForBothThemes,
    headerNavOrder,
  }
}

export default async function AffiliateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { siteSettings, hasCustomGlobalBackgroundForBothThemes, headerNavOrder } =
    await getAffiliateShellMeta()

  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed dark:hidden"
          style={{ backgroundImage: "url('/api/site/backgrounds/global?theme=light')" }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-fixed dark:block"
          style={{ backgroundImage: "url('/api/site/backgrounds/global?theme=dark')" }}
        />
      </div>
      {!hasCustomGlobalBackgroundForBothThemes && (
        <>
          <div className="absolute inset-0 z-10 radial-gradient-bg" />
          <div
            className="absolute inset-0 z-10 opacity-60"
            style={{
              background:
                "radial-gradient(100% 100% at 80% 20%, rgba(230, 27, 0, 0.08) 0%, transparent 50%)",
            }}
          />
        </>
      )}

      <div className="relative z-20">
        <Header sectionHrefPrefix="/" navOrder={headerNavOrder} />
        <main>
          {children}
        </main>
        <Footer siteSettings={siteSettings} sectionHrefPrefix="/" />
      </div>
    </div>
  )
}
