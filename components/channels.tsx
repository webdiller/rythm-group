"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { channelCategories } from "@/lib/data"
import { ExternalLink, Users } from "lucide-react"

export function Channels() {
  const { locale, t } = useLocale()
  const [activeCategory, setActiveCategory] = useState(channelCategories[0].id)

  const activeChannels = channelCategories.find((c) => c.id === activeCategory)

  return (
    <section id="channels" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t.channels.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
            {t.channels.subtitle}
          </p>
        </div>

        {/* Category tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {channelCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(230,27,0,0.2)]"
                  : "border border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {locale === "ru" ? cat.nameRu : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Channels grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeChannels?.channels.map((channel) => (
            <a
              key={channel.name}
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
                    <span>{channel.subscribers} {t.channels.subscribers}</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:text-primary group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
