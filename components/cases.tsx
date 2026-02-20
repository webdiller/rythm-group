"use client"

import { useLocale } from "@/lib/locale-context"
import { partnerLogos } from "@/lib/data"

export function Cases() {
  const { t } = useLocale()

  return (
    <section id="cases" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t.cases.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
            {t.cases.subtitle}
          </p>
        </div>

        {/* Scrolling partner logos */}
        <div className="relative overflow-hidden">
          {/* Left fade */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 bg-gradient-to-r from-background to-transparent" />
          {/* Right fade */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 bg-gradient-to-l from-background to-transparent" />

          <div className="flex animate-[scroll_30s_linear_infinite] gap-6">
            {[...partnerLogos, ...partnerLogos].map((partner, i) => (
              <div
                key={`${partner.name}-${i}`}
                className="flex h-20 min-w-[180px] items-center justify-center rounded-xl border border-border bg-card px-8 transition-all hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-bold">{partner.nameShort}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {partner.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Static grid for smaller screens */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:hidden">
          {partnerLogos.slice(0, 6).map((partner) => (
            <div
              key={partner.name}
              className="flex h-16 items-center justify-center rounded-xl border border-border bg-card px-4"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-primary">
                  <span className="text-[10px] font-bold">{partner.nameShort}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{partner.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  )
}
