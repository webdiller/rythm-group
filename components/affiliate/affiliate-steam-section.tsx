"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import type { Partner } from "@/components/cases"
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

        <div className="grid grid-cols-2 items-stretch gap-1 sm:gap-2 lg:gap-4 sm:grid-cols-3 md:grid-cols-5">
          {visibleItems.map((p) => {
            const steamUrl = p.developer_url?.trim() || ""
            const hasLink = steamUrl.length > 0
            const logoSrc = getPartnerLogoSrc(p)

            const card = (
              <div className={`flex h-full w-full flex-col items-center justify-center rounded-xl border border-border/80 bg-card/80 p-1.5 shadow-none backdrop-blur-sm transition-colors sm:p-2 ${hasLink ? "group-hover:border-primary/40" : ""}`}>
                <div className="relative flex aspect-[5/3] w-full items-center justify-center overflow-hidden rounded-lg">
                  {logoSrc ? (
                    <>
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-[5%] overflow-hidden rounded-md sm:inset-[4%]">
                        <img
                          src={logoSrc}
                          alt=""
                          className="h-full w-full object-cover opacity-80 blur-md brightness-[0.35] saturate-[0.2]"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/55" />
                      </div>
                      <img
                        src={logoSrc}
                        alt={p.name}
                        title={p.name}
                        className={`relative z-10 max-h-[90%] max-w-[90%] rounded-md object-contain ${hasLink ? "transition-transform duration-300" : ""}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </>
                  ) : (
                    <span className="line-clamp-3 px-2 text-center text-sm font-semibold leading-snug text-foreground">{p.name}</span>
                  )}
                </div>
              </div>
            )

            if (hasLink) {
              return (
                <a
                  key={p.id}
                  href={steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`${p.name} — ${t.affiliate.steam.openSteam}`}>
                  {card}
                </a>
              )
            }

            return (
              <div
                key={p.id}
                className="h-full"
                aria-label={p.name}>
                {card}
              </div>
            )
          })}
        </div>

        {items.length > MAX_VISIBLE ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              {showAll ? (locale === "ru" ? `Свернуть список (${hiddenCount})` : `Show less (${hiddenCount})`) : locale === "ru" ? `Показать ещё ${hiddenCount}` : `Show ${hiddenCount} more`}
            </button>
          </div>
        ) : null}
        {items.length === 0 ? <p className="pt-6 text-sm text-muted-foreground">{locale === "en" ? "Publishers are not added yet." : "Издатели пока не добавлены."}</p> : null}
      </div>
    </section>
  )
}
