import { LocaleProvider } from "@/lib/locale-context"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Channels, type Channel, type ChannelCategory } from "@/components/channels"
import { About } from "@/components/about"
import { Stats } from "@/components/stats"
import { Cases, type Partner, type PartnerCategory } from "@/components/cases"
import { ContactForm } from "@/components/contact-form"
import { Footer } from "@/components/footer"

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
}> {
  const baseUrl = getBaseUrl()

  const [catRes, chanRes, partnerCatRes, partnerRes] = await Promise.all([
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
  ])

  const categoriesJson = (await catRes.json()) as { data?: ChannelCategory[] }
  const rawCategories = categoriesJson.data ?? []
  const channelCategories = rawCategories.sort((a, b) => a.order_index - b.order_index)

  const channelsJson = (await chanRes.json()) as { data?: Channel[] }
  const channels = channelsJson.data ?? []

  const partnerCategoriesJson = (await partnerCatRes.json()) as { data?: PartnerCategory[] }
  const rawPartnerCategories = partnerCategoriesJson.data ?? []
  const partnerCategories = rawPartnerCategories.sort((a, b) => a.order_index - b.order_index)

  const partnersJson = (await partnerRes.json()) as { data?: Partner[] }
  const partners = partnersJson.data ?? []

  return { channelCategories, channels, partnerCategories, partners }
}

export default async function Home() {
  const { channelCategories, channels, partnerCategories, partners } = await getHomeData()

  return (
    <LocaleProvider>
      <Header />
      <main>
        <Hero />
        <Channels categories={channelCategories} channels={channels} />
        <About />
        <Stats />
        <Cases categories={partnerCategories} partners={partners} />
        <ContactForm />
      </main>
      <Footer />
    </LocaleProvider>
  )
}
