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
}> {
  const baseUrl = getBaseUrl()

  const [catRes, chanRes, partnerCatRes, partnerRes, settingsRes] = await Promise.all([
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

  return { channelCategories, channels, partnerCategories, partners, siteSettings }
}

export default async function Home() {
  const { channelCategories, channels, partnerCategories, partners, siteSettings } = await getHomeData()

  return (
    <LocaleProvider>
      <div className="min-h-screen w-full relative">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: "url('/api/site/backgrounds/global')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 z-10 radial-gradient-bg" />
        <div
          className="absolute inset-0 z-10 opacity-60"
          style={{
            background:
              "radial-gradient(100% 100% at 80% 20%, rgba(230, 27, 0, 0.08) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 z-10 opacity-40"
          style={{
            background:
              "radial-gradient(100% 100% at 20% 80%, rgba(230, 27, 0, 0.06) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-20">
          <Header />
          <main>
            <Hero />
            <Channels categories={channelCategories} channels={channels} />
            <About />
            <Stats />
            <Cases categories={partnerCategories} partners={partners} />
            <ContactForm />
          </main>
          <Footer siteSettings={siteSettings} />
        </div>
      </div>
    </LocaleProvider>
  )
}
