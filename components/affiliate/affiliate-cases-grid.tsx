"use client"

import Link from "next/link"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import type { Partner, PartnerCategory } from "@/components/cases"
import { mapPartnerToAffiliateCaseCard } from "@/lib/affiliate/cases-ui"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"

type AffiliateCasesGridProps = {
  categories: PartnerCategory[]
  partners: Partner[]
}

function getCaseCoverUrl(id: number, hasLogo: boolean): string {
  return hasLogo ? `/api/content/partners/${id}/logo` : ""
}

export function AffiliateCasesGrid({ categories, partners }: AffiliateCasesGridProps) {
  const { locale, t } = useLocale()
  const dateLocale = locale === "en" ? enUS : ru
  const sorted = [...partners].sort((a, b) => a.order_index - b.order_index)
  const cases = sorted.map((partner) => {
    const category = categories.find((x) => x.id === partner.category_id) ?? null
    const ui = mapPartnerToAffiliateCaseCard(partner)
    return {
      ...ui,
      hasLogo: Boolean(partner.logo_url),
      categoryLabel: locale === "en" ? (category?.name_en ?? "Uncategorized") : (category?.name_ru ?? "Без категории"),
    }
  })

  return (
    <section id="affiliate-cases" className="scroll-mt-28 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.affiliate.cases.title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.cases.subtitle}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => {
            const dateStr = format(new Date(c.publishedAt), "d MMM yyyy", { locale: dateLocale })
            const href = `/affiliate/cases/${c.slug}`
            const cover = getCaseCoverUrl(c.id, c.hasLogo)

            return (
              <Link key={c.slug} href={href} className="group block h-full">
                <Card className="h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-all hover:border-primary/40">
                  <div className="relative aspect-3/2 w-full overflow-hidden bg-muted">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <img
                        src={c.coverImage}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                  </div>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{c.categoryLabel}</span>
                      <span>
                        {t.affiliate.cases.publishedLabel}: {dateStr}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                      {c.title}
                    </h3>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-sm font-medium text-primary">
                        {t.affiliate.cases.wishlistsLabel}: {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(c.wishlists)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                        {t.affiliate.cases.openCase}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
        {cases.length === 0 ? (
          <p className="pt-6 text-sm text-muted-foreground">{locale === "en" ? "Cases are not added yet." : "Кейсы пока не добавлены."}</p>
        ) : null}
      </div>
    </section>
  )
}
