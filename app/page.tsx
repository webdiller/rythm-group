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
import type { AboutCardListItem } from "@/lib/schemas/about-cards"
import { getBlogCategoriesSorted, getBlogShowDatesEnabled, getPublishedPosts } from "@/lib/blog/queries"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { ServiceChannelCategories } from "@/lib/services/channel-categories"
import { ServiceChannels } from "@/lib/services/channels"
import { ServicePartnerCategories } from "@/lib/services/partner-categories"
import { ServicePartners } from "@/lib/services/partners"
import { ServiceAboutCards } from "@/lib/services/about-cards"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { hasGlobalBackgroundThemes } from "@/lib/server/global-backgrounds"

function getHomeData(): {
  channelCategories: ChannelCategory[]
  channels: Channel[]
  partnerCategories: PartnerCategory[]
  partners: Partner[]
  siteSettings: SiteSettings | null
  blogPosts: BlogPost[]
  blogCategories: BlogCategory[]
  blogShowDates: boolean
  headerNavOrder: HeaderNavItemId[]
  aboutCards: AboutCardListItem[]
} {
  const rawCategories = ServiceChannelCategories.getAll().data ?? []
  const channelCategories = [...rawCategories]
    .map((c) => ({ ...c, order_index: c.order_index ?? 0 }))
    .sort((a, b) => a.order_index - b.order_index) as ChannelCategory[]

  const channels: Channel[] = (ServiceChannels.getAll().data ?? []).map((c) => ({
    id: c.id,
    category_id: c.category_id,
    name: c.name,
    subscribers: c.subscribers,
    reach: c.reach ?? null,
    url: c.url,
    order_index: c.order_index ?? 0,
    hasAvatar: !!c.avatar,
  }))

  const rawPartnerCategories = ServicePartnerCategories.getAll().data ?? []
  const partnerCategories = [...rawPartnerCategories]
    .map((c) => ({ ...c, order_index: c.order_index ?? 0 }))
    .sort((a, b) => a.order_index - b.order_index) as PartnerCategory[]

  const partners = (ServicePartners.getAll().data ?? []) as Partner[]

  const db = getDb()
  const siteSettings = (db.select().from(tableSiteSettings).limit(1).all()[0] ??
    null) as SiteSettings | null

  let headerNavOrder: HeaderNavItemId[] = normalizeHeaderNavOrder(undefined)
  try {
    headerNavOrder = normalizeHeaderNavOrder(
      siteSettings?.headerNavOrder ? JSON.parse(siteSettings.headerNavOrder) : undefined,
    )
  } catch {
    headerNavOrder = normalizeHeaderNavOrder(undefined)
  }

  const aboutCards = (ServiceAboutCards.getAll().data ?? []) as AboutCardListItem[]

  return {
    channelCategories,
    channels,
    partnerCategories,
    partners,
    siteSettings,
    blogPosts: getPublishedPosts().slice(0, 3),
    blogCategories: getBlogCategoriesSorted(),
    blogShowDates: getBlogShowDatesEnabled(),
    headerNavOrder,
    aboutCards,
  }
}

export default async function Home() {
  const data = getHomeData()
  const bg = await hasGlobalBackgroundThemes()
  const hasCustomGlobalBackgroundForBothThemes = bg.both

  const {
    channelCategories,
    channels,
    partnerCategories,
    partners,
    siteSettings,
    blogPosts,
    blogCategories,
    blogShowDates,
    headerNavOrder,
    aboutCards,
  } = data

  const animationsEnabled = siteSettings?.heroAnimationEnabled ?? true
  const contactLayout =
    (siteSettings?.contactLayout as "formFirst" | "contactsFirst" | null) ?? "formFirst"
  const contactFormHidden = siteSettings?.contactFormHidden ?? false
  const partnersDisplayMode =
    (siteSettings?.partnersDisplayMode as "name" | "logo" | "logoAndName" | null) ??
    "logoAndName"
  const channelsShowSubscribers = siteSettings?.channels_show_subscribers ?? true
  const channelsShowReach = siteSettings?.channels_show_reach ?? true
  const channelsCardAlign =
    siteSettings?.channels_card_align === "center" || siteSettings?.channels_card_align === "right"
      ? siteSettings.channels_card_align
      : "left"

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
            <Header
              navOrder={headerNavOrder}
              logoText={siteSettings?.logo_text ?? null}
              pageBlogEnabled={siteSettings?.page_blog_enabled ?? true}
              pageAffiliateEnabled={siteSettings?.page_affiliate_enabled ?? true}
            />
            <main>
              <Hero animationEnabled={animationsEnabled} />
              <About animationsEnabled={animationsEnabled} cards={aboutCards} />
              <Channels
                categories={channelCategories}
                channels={channels}
                animationsEnabled={animationsEnabled}
                showSubscribers={channelsShowSubscribers}
                showReach={channelsShowReach}
                cardAlign={channelsCardAlign}
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
