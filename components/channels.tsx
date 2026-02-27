"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { ExternalLink, Users } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"

interface ChannelCategory {
  id: string
  name_ru: string
  name_en: string
  order_index: number
}

interface Channel {
  id: number
  category_id: string | null
  name: string
  subscribers: string
  url: string
  order_index: number
}

export function Channels() {
  const { locale, t } = useLocale()
  const [categories, setCategories] = useState<ChannelCategory[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [catRes, chanRes] = await Promise.all([
          fetch("/api/content/channel-categories"),
          fetch("/api/content/channels"),
        ])

        if (catRes.ok) {
          const json = (await catRes.json()) as { data?: ChannelCategory[] }
          const cats = (json.data ?? []).sort((a, b) => a.order_index - b.order_index)
          setCategories(cats)
          if (!activeCategory && cats.length > 0) {
            setActiveCategory(cats[0].id)
          }
        }

        if (chanRes.ok) {
          const json = (await chanRes.json()) as {
            data?: Array<Channel & { category_name_ru?: string | null; category_name_en?: string | null }>
          }
          const chans = (json.data ?? []).map((c) => ({
            id: c.id,
            category_id: c.category_id,
            name: c.name,
            subscribers: c.subscribers,
            url: c.url,
            order_index: c.order_index,
          }))
          setChannels(chans)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeCategory])

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
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка каналов...</div>
        ) : activeChannels.length === 0 ? (
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                      <span className="text-sm font-bold">{channel.name.charAt(0)}</span>
                    </div>
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
