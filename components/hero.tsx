"use client"

import { useLocale } from "@/lib/locale-context"
import { ArrowDown } from "lucide-react"

export function Hero() {
  const { t } = useLocale()

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-glow-pulse" />
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Telegram Media Holding
          </span>
        </div>

        <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-foreground md:text-7xl lg:text-8xl text-balance">
          {t.hero.title}
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl text-pretty">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(230,27,0,0.3)]"
          >
            {t.hero.cta}
          </a>
          <a
            href="#channels"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-8 py-4 text-base font-medium text-secondary-foreground transition-colors hover:bg-secondary"
          >
            {t.hero.scroll}
            <ArrowDown className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
