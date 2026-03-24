"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import type { AffiliateCaseDetailUi } from "@/lib/affiliate/cases-ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs"
import { Eye, Heart, CalendarDays, Tag } from "lucide-react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"

type AffiliateCaseDetailProps = {
  caseItem: AffiliateCaseDetailUi
}

export function AffiliateCaseDetail({ caseItem: c }: AffiliateCaseDetailProps) {
  const { locale, t } = useLocale()
  const cp = t.affiliate.casePage
  const desc = locale === "en" ? c.shortDescription_en : c.shortDescription_ru
  const category = locale === "en" ? c.category_en : c.category_ru
  const dateLocale = locale === "en" ? enUS : ru
  const formattedDate = format(new Date(c.publishedAt), "d MMM yyyy", { locale: dateLocale })

  return (
    <article className="space-y-12 pb-16">
      <AppBreadcrumbs
        items={[
          { label: locale === "en" ? "Home" : "Главная", href: "/" },
          { label: "Affiliate", href: "/affiliate" },
          { label: c.title },
        ]}
      />

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
            className="aspect-21/9 w-full object-cover md:aspect-[2.6/1]"
            loading="eager"
            decoding="async"
          />
        </div>
        <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {c.title}
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-card/85 py-0 shadow-none backdrop-blur-sm">
          <CardHeader className="px-6 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4">
            <CardTitle className="text-xl">{cp.aboutGame}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6 pt-0 text-sm text-muted-foreground md:px-8 md:pb-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                  <Tag className="h-3.5 w-3.5" />
                  {locale === "en" ? "Category" : "Категория"}
                </p>
                <p className="text-foreground">{category}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t.affiliate.cases.publishedLabel}
                </p>
                <p className="text-foreground">{formattedDate}</p>
              </div>
            </div>
            <p className="max-w-3xl text-base leading-relaxed">{desc}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="border-border/80 bg-card/85 py-0 shadow-none">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.affiliate.cases.wishlistsLabel}</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(c.wishlists)}
                </p>
              </div>
              <Heart className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card/85 py-0 shadow-none">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{cp.views}</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(c.views)}
                </p>
              </div>
              <Eye className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        </div>
      </section>
    </article>
  )
}
