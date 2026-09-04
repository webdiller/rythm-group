"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { BarChart3, Users } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"
import Link from "next/link"
import { cn } from "@/lib/utils"

export interface ChannelCategory {
  id: string
  name_ru: string
  name_en: string
  order_index: number
}

export interface Channel {
  id: number
  category_id: string | null
  name: string
  subscribers: string
  // Average reach/coverage per channel
  reach?: string | null
  url: string
  order_index: number
  hasAvatar?: boolean
}

export type ChannelsCardAlign = "left" | "center" | "right"

interface ChannelsProps {
  categories: ChannelCategory[]
  channels: Channel[]
  animationsEnabled?: boolean
  showSubscribers?: boolean
  showReach?: boolean
  cardAlign?: ChannelsCardAlign
}

export function Channels({
  categories,
  channels,
  animationsEnabled = true,
  showSubscribers = true,
  showReach = true,
  cardAlign = "left",
}: ChannelsProps) {
  const { locale, t } = useLocale()
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  )
  const [showAll, setShowAll] = useState(false)
  const [showAllUncategorized, setShowAllUncategorized] = useState(false)

  const activeCategoryId = activeCategory ?? categories[0]?.id ?? null
  const activeChannels = activeCategoryId
    ? channels
        .filter((c) => c.category_id === activeCategoryId)
        .sort((a, b) => a.order_index - b.order_index)
    : []

  const uncategorizedChannels = channels
    .filter((c) => !c.category_id)
    .sort((a, b) => a.order_index - b.order_index)

  useEffect(() => {
    setShowAll(false)
  }, [activeCategoryId])

  const MAX_VISIBLE_CATEGORY = 6
  const MAX_VISIBLE_UNCATEGORIZED = 6

  const visibleChannels = showAll ? activeChannels : activeChannels.slice(0, MAX_VISIBLE_CATEGORY)
  const hiddenCount = Math.max(0, activeChannels.length - MAX_VISIBLE_CATEGORY)

  const visibleUncategorized = showAllUncategorized
    ? uncategorizedChannels
    : uncategorizedChannels.slice(0, MAX_VISIBLE_UNCATEGORIZED)
  const uncategorizedHiddenCount = Math.max(0, uncategorizedChannels.length - MAX_VISIBLE_UNCATEGORIZED)

  const renderCard = (channel: Channel, index: number) => (
    <ScrollStagger
      key={channel.id}
      index={index}
      delayStep={80}
      disabled={!animationsEnabled}
    >
      <ChannelCard
        channel={channel}
        showSubscribers={showSubscribers}
        showReach={showReach}
        cardAlign={cardAlign}
        subscribersLabel={t.channels.subscribers}
        reachLabel={t.channels.reach}
      />
    </ScrollStagger>
  )

  return (
    <section id="channels" className="relative px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className={`text-center ${categories.length === 0 ? "mb-6 md:mb-8" : "mb-12 md:mb-16"}`}>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t.channels.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
              {t.channels.subtitle}
            </p>
          </div>
        </ScrollReveal>

        {uncategorizedChannels.length > 0 && (
          <div className="mt-4 mb-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleUncategorized.map((channel, index) => renderCard(channel, index))}
            </div>
            {uncategorizedChannels.length > MAX_VISIBLE_UNCATEGORIZED && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllUncategorized((prev) => !prev)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {showAllUncategorized
                    ? locale === "ru"
                      ? `Свернуть список (${uncategorizedHiddenCount})`
                      : `Show less (${uncategorizedHiddenCount})`
                    : locale === "ru"
                      ? `Показать ещё ${uncategorizedHiddenCount}`
                      : `Show ${uncategorizedHiddenCount} more`}
                </button>
              </div>
            )}
          </div>
        )}

        {categories.length > 0 && (
          <>
            <ScrollReveal disabled={!animationsEnabled}>
              <div className="mb-10">
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                        activeCategoryId === cat.id
                          ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(230,27,0,0.2)]"
                          : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {locale === "ru" ? cat.name_ru : cat.name_en}
                    </button>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {activeChannels.length === 0 && uncategorizedChannels.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {locale === "ru" ? "Каналы не найдены." : "No channels found."}
              </div>
            ) : activeChannels.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleChannels.map((channel, index) => renderCard(channel, index))}
                </div>
                {activeChannels.length > MAX_VISIBLE_CATEGORY && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAll((prev) => !prev)}
                      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {showAll
                        ? locale === "ru"
                          ? `Свернуть список (${hiddenCount})`
                          : `Show less (${hiddenCount})`
                        : locale === "ru"
                          ? `Показать ещё ${hiddenCount}`
                          : `Show ${hiddenCount} more`}
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}

        {categories.length === 0 && uncategorizedChannels.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {locale === "ru" ? "Каналы не найдены." : "No channels found."}
          </div>
        )}
      </div>
    </section>
  )
}

function ChannelCard({
  channel,
  showSubscribers,
  showReach,
  cardAlign,
  subscribersLabel,
  reachLabel,
}: {
  channel: Channel
  showSubscribers: boolean
  showReach: boolean
  cardAlign: ChannelsCardAlign
  subscribersLabel: string
  reachLabel: string
}) {
  const showMeta =
    (showSubscribers && Boolean(channel.subscribers)) ||
    (showReach && Boolean(channel.reach))

  return (
    <Link
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 glow-border",
        cardAlign === "center" && "flex flex-col items-center gap-3 text-center",
        cardAlign === "left" && "flex items-center gap-4",
        cardAlign === "right" && "flex flex-row-reverse items-center gap-4 text-right",
      )}
    >
      <ChannelAvatar channelId={channel.id} name={channel.name} hasAvatar={channel.hasAvatar} />
      <div className={cn(cardAlign === "center" && "flex flex-col items-center")}>
        <h3 className="text-base font-semibold text-card-foreground md:text-lg">{channel.name}</h3>
        {showMeta ? (
          <div
            className={cn(
              "mt-1.5 flex flex-col gap-1 text-xs text-muted-foreground",
              cardAlign === "center" && "items-center",
              cardAlign === "right" && "items-end",
            )}
          >
            {showSubscribers && channel.subscribers ? (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {channel.subscribers} {subscribersLabel}
                </span>
              </div>
            ) : null}
            {showReach && channel.reach ? (
              <div className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span>
                  {channel.reach} {reachLabel}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  )
}

function ChannelAvatar({
  channelId,
  name,
  hasAvatar,
}: {
  channelId: number
  name: string
  hasAvatar?: boolean
}) {
  const [hasImage, setHasImage] = useState(hasAvatar ?? true)
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 md:h-20 md:w-20">
      {hasImage && (
        <img
          src={`/api/content/channels/${channelId}/avatar`}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasImage(false)}
        />
      )}
      {!hasImage && <span className="text-xl font-bold md:text-2xl">{name.charAt(0)}</span>}
    </div>
  )
}
