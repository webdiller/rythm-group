"use client"

import { useLocale } from "@/lib/locale-context"
import { STEAM_PUBLISHERS_MOCK } from "@/lib/affiliate/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

export function AffiliateSteamSection() {
  const { locale, t } = useLocale()
  const items = STEAM_PUBLISHERS_MOCK.filter((p) => !p.hidden)

  return (
    <section className="border-t border-border/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.affiliate.steam.title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.steam.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((p) => {
            const name = locale === "en" ? p.name_en : p.name_ru
            return (
              <a
                key={p.id}
                href={p.steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full"
              >
                <Card className="h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-all hover:border-primary/40">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                      <img
                        src={p.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                        {name}
                      </h3>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        {t.affiliate.steam.openSteam}
                        <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
                      </span>
                    </div>
                  </div>
                  <CardContent className="border-t border-border/60 px-5 py-3">
                    <p className="truncate text-xs text-muted-foreground">{p.steamUrl}</p>
                  </CardContent>
                </Card>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
