import { LocaleProvider } from "@/lib/locale-context"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Channels, type Channel, type ChannelCategory } from "@/components/channels"
import { About } from "@/components/about"
import { Stats } from "@/components/stats"
import { Cases, type Partner, type PartnerCategory } from "@/components/cases"
import { ContactForm } from "@/components/contact-form"
import { Footer, type SiteSettings } from "@/components/footer"
import type { GetAllResponse as ChannelsGetAllResponse } from "@/lib/schemas/channels"
import { SiteShell } from "@/components/SiteShell"

function getBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (siteUrl) {
    if (siteUrl.startsWith("http")) return siteUrl
    return `https://${siteUrl}`
  }
  return "http://localhost:3000"
}

async function getHomeData(): Promise<{
  channelCategories: ChannelCategory[]
  channels: Channel[]
  partnerCategories: PartnerCategory[]
  partners: Partner[]
  siteSettings: SiteSettings | null
  hasCustomGlobalBackgroundForBothThemes: boolean
  hasAnyCustomBackgrounds: boolean
}> {
  const baseUrl = getBaseUrl()

  const [
    catRes,
    chanRes,
    partnerCatRes,
    partnerRes,
    settingsRes,
    globalLightBgRes,
    globalDarkBgRes,
  ] = await Promise.all([
    fetch(`${baseUrl}/api/content/channel-categories`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/content/channels`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/content/partner-categories`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/content/partners`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/site/settings`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=light`, {
      cache: "no-store",
    }),
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=dark`, {
      cache: "no-store",
    }),
  ])

  const categoriesJson = (await catRes.json()) as { data?: ChannelCategory[] }
  const rawCategories = categoriesJson.data ?? []
  const channelCategories = rawCategories.sort((a, b) => a.order_index - b.order_index)

  const channelsJson = (await chanRes.json()) as ChannelsGetAllResponse
  const channels: Channel[] = (channelsJson.data ?? []).map((c) => ({
    id: c.id,
    category_id: c.category_id,
    name: c.name,
    subscribers: c.subscribers,
    reach: c.reach ?? null,
    url: c.url,
    order_index: c.order_index ?? 0,
    hasAvatar: !!c.avatar,
  }))

  const partnerCategoriesJson = (await partnerCatRes.json()) as { data?: PartnerCategory[] }
  const rawPartnerCategories = partnerCategoriesJson.data ?? []
  const partnerCategories = rawPartnerCategories.sort((a, b) => a.order_index - b.order_index)

  const partnersJson = (await partnerRes.json()) as { data?: Partner[] }
  const partners = partnersJson.data ?? []

  let siteSettings: SiteSettings | null = null
  if (settingsRes.ok) {
    const settingsJson = (await settingsRes.json()) as { data?: SiteSettings | null }
    siteSettings = settingsJson.data ?? null
  }

  const hasCustomGlobalBackgroundForBothThemes = globalLightBgRes.ok && globalDarkBgRes.ok
  const hasAnyCustomBackgrounds = globalLightBgRes.ok || globalDarkBgRes.ok

  return {
    channelCategories,
    channels,
    partnerCategories,
    partners,
    siteSettings,
    hasCustomGlobalBackgroundForBothThemes,
    hasAnyCustomBackgrounds,
  }
}

export default async function Home() {
  const {
    channelCategories,
    channels,
    partnerCategories,
    partners,
    siteSettings,
    hasCustomGlobalBackgroundForBothThemes,
    hasAnyCustomBackgrounds,
  } = await getHomeData()

  const heroAnimationEnabled = siteSettings?.heroAnimationEnabled ?? true

  return (
    <LocaleProvider>
      <SiteShell hasAnyCustomBackgrounds={hasAnyCustomBackgrounds}>
        <div className="min-h-screen w-full relative">
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
            <Header />
            <main>
              <Hero animationEnabled={heroAnimationEnabled} />
              <About />
              <Channels categories={channelCategories} channels={channels} />
              <Stats />
              <Cases categories={partnerCategories} partners={partners} />
              <ContactForm />
            </main>
            <Footer siteSettings={siteSettings} />
          </div>
        </div>
      </SiteShell>
    </LocaleProvider>
  )
}
