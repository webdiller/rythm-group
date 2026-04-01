import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Channels, type Channel, type ChannelCategory } from "@/components/channels"
import { About } from "@/components/about"
import { Stats } from "@/components/stats"
import { Cases, type Partner, type PartnerCategory } from "@/components/cases"
import { ContactForm } from "@/components/contact-form"
import { Footer, type SiteSettings } from "@/components/footer"
import { normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"
import { LandingBlogSection } from "@/components/landing-blog-section"
import type { GetAllResponse as ChannelsGetAllResponse } from "@/lib/schemas/channels"
import { getBlogCategoriesSorted, getBlogShowDatesEnabled, getPublishedPosts } from "@/lib/blog/queries"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { getSiteBaseUrl } from "@/lib/site-url"

async function getHomeData(): Promise<{
  channelCategories: ChannelCategory[]
  channels: Channel[]
  partnerCategories: PartnerCategory[]
  partners: Partner[]
  siteSettings: SiteSettings | null
  hasCustomGlobalBackgroundForBothThemes: boolean
  blogPosts: BlogPost[]
  blogCategories: BlogCategory[]
  blogShowDates: boolean
  headerNavOrder: HeaderNavItemId[]
}> {
  const baseUrl = getSiteBaseUrl()

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

  const blogPosts = getPublishedPosts().slice(0, 3)
  const blogCategories = getBlogCategoriesSorted()
  const blogShowDates = getBlogShowDatesEnabled()

  return {
    channelCategories,
    channels,
    partnerCategories,
    partners,
    siteSettings,
    hasCustomGlobalBackgroundForBothThemes,
    blogPosts,
    blogCategories,
    blogShowDates,
    headerNavOrder,
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
    blogPosts,
    blogCategories,
    blogShowDates,
    headerNavOrder,
  } = await getHomeData()

  const animationsEnabled = siteSettings?.heroAnimationEnabled ?? true
  const contactLayout =
    (siteSettings?.contactLayout as "formFirst" | "contactsFirst" | null) ?? "formFirst"
  const contactFormHidden = siteSettings?.contactFormHidden ?? false
  const partnersDisplayMode =
    (siteSettings?.partnersDisplayMode as "name" | "logo" | "logoAndName" | null) ??
    "logoAndName"

  return (
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
            <Header navOrder={headerNavOrder} />
            <main>
              <Hero animationEnabled={animationsEnabled} />
              <About animationsEnabled={animationsEnabled} />
              <Channels
                categories={channelCategories}
                channels={channels}
                animationsEnabled={animationsEnabled}
              />
              <Stats animationsEnabled={animationsEnabled} />
              <Cases
                categories={partnerCategories}
                partners={partners}
                animationsEnabled={animationsEnabled}
                displayMode={partnersDisplayMode}
              />
              <LandingBlogSection
                posts={blogPosts}
                categories={blogCategories}
                showDates={blogShowDates}
                animationsEnabled={animationsEnabled}
              />
              <ContactForm
                animationsEnabled={animationsEnabled}
                layout={contactLayout}
                hideForm={contactFormHidden}
              />
            </main>
            <Footer siteSettings={siteSettings} />
          </div>
        </div>
  )
}
