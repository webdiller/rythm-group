"use client"

import Link from "next/link"
import { useState } from "react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import type { Partner, PartnerCategory } from "@/components/cases"
import { mapPartnerToAffiliateCaseCard } from "@/lib/affiliate/cases-ui"
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
  const uncategorizedPartners = partnersSorted.filter((p) => p.category_id == null && (p.show_in_affiliate_cases ?? true))
  const hasAnyPartners = partnersByCategory.some((group) => group.partners.length > 0) || uncategorizedPartners.length > 0

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
    const href = partner.target_url?.trim() || null
    const imageSrc = getPartnerLogoSrc(partner) || ui.coverImage?.trim() || ""
    const showImage = Boolean(imageSrc) && !brokenImageByPartner[partner.id]
    const title = locale === "en" ? partner.title_en || partner.name : partner.title_ru || partner.name
    const description =
      (locale === "en"
        ? partner.short_description_en || partner.short_description_ru
        : partner.short_description_ru || partner.short_description_en)?.trim() || ""
    const showWishlists = partner.show_wishlists ?? true

    const onImageError = () =>
      setBrokenImageByPartner((prev) =>
        prev[partner.id]
          ? prev
          : {
              ...prev,
              [partner.id]: true,
            },
      )

    const articleClassName = `flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-none backdrop-blur-md transition-[border-color,box-shadow] duration-300 ${
      href ? "hover:border-primary/35 hover:shadow-[0_8px_28px_-18px_rgba(230,27,0,0.4)]" : ""
    }`

    const card = (
      <article className={articleClassName}>
        <div className="relative aspect-2/1 w-full overflow-hidden bg-muted/50">
          {showImage ? (
            <>
              <img
                src={imageSrc}
                alt=""
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75 blur-xl saturate-125 transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-linear-to-t from-card/70 via-card/15 to-transparent" />
              <div className="relative z-10 flex h-full items-center justify-center p-2.5 sm:p-3">
                <img
                  src={imageSrc}
                  alt={title}
                  className="p-2 w-auto h-full rounded-2xl object-contain drop-shadow-sm transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                  onError={onImageError}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-4">
              <span className="line-clamp-2 text-center font-(family-name:--font-space-grotesk) text-lg font-semibold tracking-tight text-muted-foreground/80">
                {partner.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <time
            dateTime={parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : undefined}
            className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {dateStr}
          </time>

          <h3
            className={`line-clamp-2 font-(family-name:--font-space-grotesk) text-lg font-semibold leading-snug tracking-tight text-foreground ${
              href ? "transition-colors group-hover:text-primary" : ""
            }`}
          >
            {title}
          </h3>

          {description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}

          <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
            {showWishlists ? (
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{t.affiliate.cases.wishlistsLabel}</p>
                <p className="truncate text-sm font-semibold tabular-nums text-primary">{nf.format(ui.wishlists)}</p>
              </div>
            ) : (
              <span />
            )}
            {href ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                {t.affiliate.cases.openCase}
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            ) : null}
          </div>
        </div>
      </article>
    )

    if (!href) {
      return (
        <div
          key={ui.slug}
          className="h-full"
        >
          {card}
        </div>
      )
    }

    const isExternal = /^https?:\/\//i.test(href) || href.startsWith("//")
    const linkClassName =
      "group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

    if (isExternal) {
      return (
        <a
          key={ui.slug}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {card}
        </a>
      )
    }

    return (
      <Link
        key={ui.slug}
        href={href}
        className={linkClassName}
      >
        {card}
      </Link>
    )
  }

  return (
    <section
      id="cases"
      className="py-16 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl space-y-3">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.affiliate.cases.title}</h2>
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
                <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">{locale === "en" ? category.name_en : category.name_ru}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visiblePartners.map((partner) => renderCaseCard(partner))}</div>
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
                      {isExpanded ? (locale === "ru" ? `Свернуть список (${hiddenCount})` : `Show less (${hiddenCount})`) : locale === "ru" ? `Показать ещё ${hiddenCount}` : `Show ${hiddenCount} more`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {uncategorizedPartners.length > 0 && (
            <div>
              <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">{t.cases.uncategorizedTitle}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{(showAllUncategorized ? uncategorizedPartners : uncategorizedPartners.slice(0, MAX_VISIBLE)).map((partner) => renderCaseCard(partner))}</div>
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

          {!hasAnyPartners && <p className="pt-2 text-sm text-muted-foreground">{locale === "en" ? "Cases are not added yet." : "Кейсы пока не добавлены."}</p>}
        </div>
      </div>
    </section>
  )
}
