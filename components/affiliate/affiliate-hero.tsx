"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import { resolveNavHref } from "@/lib/nav-hrefs"

type AffiliateHeroData = {
  badge_ru: string
  badge_en: string
  title_ru: string
  title_en: string
  subtitle_ru: string
  subtitle_en: string
  cta_primary_ru: string
  cta_primary_en: string
  cta_secondary_ru: string
  cta_secondary_en: string
}

type AffiliateHeroProps = {
  data?: AffiliateHeroData | null
}

export function AffiliateHero({ data }: AffiliateHeroProps) {
  const { locale, t } = useLocale()
  const a = t.affiliate.hero
  const contactHref = resolveNavHref("#contact", "/")
  const moreHref = "/affiliate#affiliate-formats"
  const badge = data ? (locale === "en" ? data.badge_en : data.badge_ru) : a.badge
  const title = data ? (locale === "en" ? data.title_en : data.title_ru) : a.title
  const subtitle = data ? (locale === "en" ? data.subtitle_en : data.subtitle_ru) : a.subtitle
  const ctaPrimary = data
    ? locale === "en"
      ? data.cta_primary_en
      : data.cta_primary_ru
    : a.ctaPrimary
  const ctaSecondary = data
    ? locale === "en"
      ? data.cta_secondary_en
      : data.cta_secondary_ru
    : a.ctaSecondary

  return (
    <div className="relative">
      <section className="relative flex min-h-[min(100vh,920px)] items-center justify-center overflow-hidden px-6 pt-24 pb-14 md:pt-28 md:pb-16">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          <div
            className="absolute inset-0 bg-cover bg-center dark:hidden"
            style={{ backgroundImage: "url('/api/site/backgrounds/hero?theme=light')" }}
          />
          <div
            className="absolute inset-0 hidden bg-cover bg-center dark:block"
            style={{ backgroundImage: "url('/api/site/backgrounds/hero?theme=dark')" }}
          />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-medium uppercase tracking-wider">{badge}</span>
          </div>

          <h1 className="mb-6 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-7xl">
            {title}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
            {subtitle}
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href={contactHref}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 sm:px-7 sm:py-3.5 md:px-8 md:py-4 md:text-base"
            >
              {ctaPrimary}
            </Link>
            <Link
              href={moreHref}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-6 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary sm:px-7 sm:py-3.5 md:px-8 md:py-4 md:text-base"
            >
              {ctaSecondary}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
