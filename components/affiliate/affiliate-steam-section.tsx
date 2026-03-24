"use client"

import { useLocale } from "@/lib/locale-context"
import type { Partner } from "@/components/cases"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

type AffiliateSteamSectionProps = {
  partners: Partner[]
}

function buildSteamSearchUrl(name: string): string {
  return `https://store.steampowered.com/search/?developer=${encodeURIComponent(name)}`
}

export function AffiliateSteamSection({ partners }: AffiliateSteamSectionProps) {
  const { locale, t } = useLocale()
  const items = [...partners]
    .filter((p) => p.show_in_affiliate_steam ?? true)
    .sort((a, b) => a.order_index - b.order_index)
    .slice(0, 8)

  return (
    <section className="border-t border-border/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.affiliate.steam.title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.steam.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {items.map((p) => {
            const steamUrl = p.developer_url || buildSteamSearchUrl(p.name)
            return (
              <a
                key={p.id}
                href={steamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full"
              >
                <Card className="h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-all hover:border-primary/40">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                      {p.logo_url ? (
                        <img
                          src={`/api/content/partners/${p.id}/logo`}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          Steam
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                        {p.name}
                      </h3>
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        {t.affiliate.steam.openSteam}
                        <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
                      </span>
                    </div>
                  </div>
                </Card>
              </a>
            )
          })}
        </div>
        {items.length === 0 ? (
          <p className="pt-6 text-sm text-muted-foreground">
            {locale === "en" ? "Publishers are not added yet." : "Издатели пока не добавлены."}
          </p>
        ) : null}
      </div>
    </section>
  )
}
