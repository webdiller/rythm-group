"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import type { AffiliateCaseMock } from "@/lib/affiliate/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Eye } from "lucide-react"

type AffiliateCaseDetailProps = {
  caseItem: AffiliateCaseMock
}

export function AffiliateCaseDetail({ caseItem: c }: AffiliateCaseDetailProps) {
  const { locale, t } = useLocale()
  const cp = t.affiliate.casePage
  const title = locale === "en" ? c.gameTitle_en : c.gameTitle_ru
  const desc = locale === "en" ? c.shortDescription_en : c.shortDescription_ru
  const timeline = locale === "en" ? c.timeline_en : c.timeline_ru

  return (
    <article className="space-y-12 pb-16">
      <Link
        href="/affiliate"
        className="inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {cp.back}
      </Link>

      <header className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted">
          <img
            src={c.coverImage}
            alt=""
            className="aspect-[21/9] w-full object-cover md:aspect-[2.4/1]"
            loading="eager"
            decoding="async"
          />
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t.affiliate.cases.wishlistsLabel}: <span className="font-semibold text-foreground">{c.wishlists}</span>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{cp.aboutGame}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{desc}</p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-foreground">{cp.socialProof}</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {c.socialScreens.map((shot, i) => (
            <Card
              key={`${c.slug}-shot-${i}`}
              className="overflow-hidden border-border/80 bg-card/80 py-0 shadow-none"
            >
              <div className="aspect-video w-full bg-muted">
                <img src={shot.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-primary" aria-hidden />
                  {cp.reactions}: {shot.reactions}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" aria-hidden />
                  {cp.views}: {shot.views}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{cp.timeline}</h2>
        <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">{timeline}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">{cp.steamStats}</h2>
        <div className="overflow-hidden rounded-xl border border-border/80 bg-muted/40">
          <img
            src={c.statsScreenshot}
            alt=""
            className="w-full object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </article>
  )
}
