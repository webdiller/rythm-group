"use client"

import { useState, type ReactNode } from "react"
import { useLocale } from "@/lib/locale-context"
import type { Partner } from "@/components/cases"
import { Card } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"

type AffiliateSteamSectionProps = {
  partners: Partner[]
}

export function AffiliateSteamSection({ partners }: AffiliateSteamSectionProps) {
  const { locale, t } = useLocale()
  const [showAll, setShowAll] = useState(false)
  const MAX_VISIBLE = 16
  const items = [...partners].filter((p) => p.show_in_affiliate_steam ?? true).sort((a, b) => a.order_index - b.order_index)
  const visibleItems = showAll ? items : items.slice(0, MAX_VISIBLE)
  const hiddenCount = Math.max(0, items.length - MAX_VISIBLE)

  return (
    <section className="border-t border-border/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.affiliate.steam.title}</h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.steam.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {visibleItems.map((p) => {
            const steamUrl = p.developer_url?.trim() || ""
            const hasLink = steamUrl.length > 0
            const logoSrc = getPartnerLogoSrc(p)

            const cardInner = (
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-28">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt=""
                      className={`h-full w-full object-contain p-2 ${hasLink ? "transition-transform duration-300 group-hover:scale-105" : ""}`}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Steam</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className={`text-lg font-semibold leading-snug text-foreground ${hasLink ? "group-hover:text-primary" : ""}`}>{p.name}</h3>
                  {hasLink ? (
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      {t.affiliate.steam.openSteam}
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
                    </span>
                  ) : null}
                </div>
              </div>
            )

            return (
              <SteamPublisherCard
                key={p.id}
                href={hasLink ? steamUrl : null}
              >
                {cardInner}
              </SteamPublisherCard>
            )
          })}
        </div>
        {items.length > MAX_VISIBLE ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {showAll ? (locale === "ru" ? `Свернуть список (${hiddenCount})` : `Show less (${hiddenCount})`) : locale === "ru" ? `Показать ещё ${hiddenCount}` : `Show ${hiddenCount} more`}
            </button>
          </div>
        ) : null}
        {items.length === 0 ? <p className="pt-6 text-sm text-muted-foreground">{locale === "en" ? "Publishers are not added yet." : "Издатели пока не добавлены."}</p> : null}
      </div>
    </section>
  )
}

function SteamPublisherCard({ href, children }: { href: string | null; children: ReactNode }) {
  const cardClassName = "h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm"

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full"
      >
        <Card className={`${cardClassName} transition-all hover:border-primary/40`}>{children}</Card>
      </a>
    )
  }

  return <Card className={cardClassName}>{children}</Card>
}
