"use client"

import { useLocale } from "@/lib/locale-context"
import { ArrowDown } from "lucide-react"

export function Hero() {
  const { t } = useLocale()

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background grid pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Central glow */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

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
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
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

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
