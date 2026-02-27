"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { ExternalLink, Users } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"

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
  url: string
  order_index: number
  hasAvatar?: boolean
}

interface ChannelsProps {
  categories: ChannelCategory[]
  channels: Channel[]
}

export function Channels({ categories, channels }: ChannelsProps) {
  const { locale, t } = useLocale()
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories[0]?.id ?? null,
  )

  const activeCategoryId = activeCategory ?? categories[0]?.id ?? null

  const activeChannels = activeCategoryId
    ? channels
        .filter((c) => c.category_id === activeCategoryId)
        .sort((a, b) => a.order_index - b.order_index)
    : []

  return (
    <section id="channels" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t.channels.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
              {t.channels.subtitle}
            </p>
          </div>
        </ScrollReveal>

        {/* Category tabs */}
        <ScrollReveal>
          <div className="mb-10 flex flex-wrap justify-center gap-2">
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
        </ScrollReveal>

        {/* Channels grid */}
        {activeChannels.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {locale === "ru" ? "Каналы не найдены." : "No channels found."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeChannels.map((channel, index) => (
              <ScrollStagger key={channel.id} index={index} delayStep={80}>
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 glow-border"
                >
                  <div className="flex items-center gap-4">
                    <ChannelAvatar
                      channelId={channel.id}
                      name={channel.name}
                      hasAvatar={channel.hasAvatar}
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-card-foreground">{channel.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>
                          {channel.subscribers} {t.channels.subscribers}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:text-primary group-hover:opacity-100" />
                </a>
              </ScrollStagger>
            ))}
          </div>
        )}
      </div>
    </section>
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
    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20 overflow-hidden">
      {hasImage && (
        <img
          src={`/api/content/channels/${channelId}/avatar`}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasImage(false)}
        />
      )}
      {!hasImage && <span className="text-sm font-bold">{name.charAt(0)}</span>}
    </div>
  )
}
