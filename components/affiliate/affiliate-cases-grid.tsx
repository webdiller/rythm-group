"use client"

import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import type { Partner, PartnerCategory } from "@/components/cases"
import { mapPartnerToAffiliateCaseCard } from "@/lib/affiliate/cases-ui"
import { wishlistsCasePath } from "@/lib/wishlists-path"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight } from "lucide-react"
import { getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"

type AffiliateCasesGridProps = {
  categories: PartnerCategory[]
  partners: Partner[]
}

export function AffiliateCasesGrid({ categories, partners }: AffiliateCasesGridProps) {
  const { locale, t } = useLocale()
  const dateLocale = locale === "en" ? enUS : ru
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
  const [showAllUncategorized, setShowAllUncategorized] = useState(false)
  const [brokenImageByPartner, setBrokenImageByPartner] = useState<Record<number, true>>({})
  const MAX_VISIBLE = 6

  const categoriesOrdered = [...categories].sort((a, b) => a.order_index - b.order_index)
  const partnersSorted = [...partners].sort((a, b) => a.order_index - b.order_index)
  const partnersByCategory = categoriesOrdered.map((cat) => ({
    category: cat,
    partners: partnersSorted.filter((p) => p.category_id === cat.id && (p.show_in_affiliate_cases ?? true)),
  }))
  const uncategorizedPartners = partnersSorted.filter(
    (p) => p.category_id == null && (p.show_in_affiliate_cases ?? true),
  )
  const hasAnyPartners =
    partnersByCategory.some((group) => group.partners.length > 0) || uncategorizedPartners.length > 0

  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU")

  const renderCaseCard = (partner: Partner) => {
    const ui = mapPartnerToAffiliateCaseCard(partner)
    const parsedDate = ui.publishedAt ? new Date(ui.publishedAt) : null
    const dateStr =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? format(parsedDate, "d MMM yyyy", { locale: dateLocale })
        : locale === "en"
          ? "No date"
          : "Без даты"
    const href = partner.target_url || wishlistsCasePath(ui.slug)
    const imageSrc = getPartnerLogoSrc(partner) || ui.coverImage?.trim() || ""
    const showImage = Boolean(imageSrc) && !brokenImageByPartner[partner.id]
    const title =
      locale === "en" ? partner.title_en || partner.name : partner.title_ru || partner.name

    return (
      <Link key={ui.slug} href={href} className="group block h-full">
        <Card className="h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-all hover:border-primary/40">
          {showImage ? (
            <div className="relative aspect-3/2 w-full overflow-hidden bg-muted">
              <img
                src={imageSrc}
                alt=""
                className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
                onError={() =>
                  setBrokenImageByPartner((prev) =>
                    prev[partner.id]
                      ? prev
                      : {
                          ...prev,
                          [partner.id]: true,
                        },
                  )
                }
              />
            </div>
          ) : null}
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {t.affiliate.cases.publishedLabel}: {dateStr}
              </span>
            </div>
            <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
              {title}
            </h3>
            <div className="flex items-center justify-between gap-2 pt-1">
              {(partner.show_wishlists ?? true) ? (
                <span className="text-sm font-medium text-primary">
                  {t.affiliate.cases.wishlistsLabel}: {nf.format(ui.wishlists)}
                </span>
              ) : (
                <span />
              )}
              <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t.affiliate.cases.openCase}
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <section id="affiliate-cases" className="py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.affiliate.cases.title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.cases.subtitle}</p>
        </div>

        <div className="space-y-12">
          {partnersByCategory.map(({ category, partners: categoryPartners }) => {
            if (categoryPartners.length === 0) return null
            const isExpanded = expandedCategories[category.id] ?? false
            const visiblePartners = isExpanded ? categoryPartners : categoryPartners.slice(0, MAX_VISIBLE)
            const hiddenCount = Math.max(0, categoryPartners.length - MAX_VISIBLE)

            return (
              <div key={category.id}>
                <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
                  {locale === "en" ? category.name_en : category.name_ru}
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visiblePartners.map((partner) => renderCaseCard(partner))}
                </div>
                {categoryPartners.length > MAX_VISIBLE && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [category.id]: !isExpanded,
                        }))
                      }
                      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {isExpanded
                        ? locale === "ru"
                          ? `Свернуть список (${hiddenCount})`
                          : `Show less (${hiddenCount})`
                        : locale === "ru"
                          ? `Показать ещё ${hiddenCount}`
                          : `Show ${hiddenCount} more`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {uncategorizedPartners.length > 0 && (
            <div>
              <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
                {t.cases.uncategorizedTitle}
              </h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(showAllUncategorized
                  ? uncategorizedPartners
                  : uncategorizedPartners.slice(0, MAX_VISIBLE)
                ).map((partner) => renderCaseCard(partner))}
              </div>
              {uncategorizedPartners.length > MAX_VISIBLE && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllUncategorized((prev) => !prev)}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {showAllUncategorized
                      ? locale === "ru"
                        ? `Свернуть список (${uncategorizedPartners.length - MAX_VISIBLE})`
                        : `Show less (${uncategorizedPartners.length - MAX_VISIBLE})`
                      : locale === "ru"
                        ? `Показать ещё ${uncategorizedPartners.length - MAX_VISIBLE}`
                        : `Show ${uncategorizedPartners.length - MAX_VISIBLE} more`}
                  </button>
                </div>
              )}
            </div>
          )}

          {!hasAnyPartners && (
            <p className="pt-2 text-sm text-muted-foreground">
              {locale === "en" ? "Cases are not added yet." : "Кейсы пока не добавлены."}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
