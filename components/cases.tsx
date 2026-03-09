"use client"

import { useState } from "react"
import clsx from "clsx"
import { useLocale } from "@/lib/locale-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

type PartnerDisplayMode = "name" | "logo" | "logoAndName"

export interface PartnerCategory {
  id: number
  name: string
  order_index: number
}

export interface Partner {
  id: number
  category_id: number | null
  name: string
  logo_url: string | null
  order_index: number
}

interface CasesProps {
  categories: PartnerCategory[]
  partners: Partner[]
  animationsEnabled?: boolean
  displayMode?: PartnerDisplayMode
}

export function Cases({
  categories,
  partners,
  animationsEnabled = true,
  displayMode = "logoAndName",
}: CasesProps) {
  const { locale, t } = useLocale()
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({})
  const [showAllUncategorized, setShowAllUncategorized] = useState(false)
  const MAX_VISIBLE = 10

  const categoriesOrdered = [...categories].sort((a, b) => a.order_index - b.order_index)
  const partnersByCategory = categoriesOrdered.map((cat) => ({
    category: cat,
    partners: partners
      .filter((p) => p.category_id === cat.id)
      .sort((a, b) => a.order_index - b.order_index),
  }))

  const uncategorizedPartners = partners
    .filter((p) => p.category_id == null)
    .sort((a, b) => a.order_index - b.order_index)

  const hasAnyPartners =
    partnersByCategory.some((group) => group.partners.length > 0) ||
    uncategorizedPartners.length > 0

  return (
    <section id="cases" className="relative px-6 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t.cases.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
              {t.cases.subtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-12">
          {partnersByCategory.map(
            ({ category, partners: categoryPartners }) => {
              if (categoryPartners.length === 0) return null

              const isExpanded = expandedCategories[category.id] ?? false
              const visiblePartners = isExpanded
                ? categoryPartners
                : categoryPartners.slice(0, MAX_VISIBLE)
              const hiddenCount = Math.max(0, categoryPartners.length - MAX_VISIBLE)

              return (
                <ScrollReveal key={category.id} disabled={!animationsEnabled}>
                  <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {visiblePartners.map((partner) => (
                      <PartnerCard key={partner.id} partner={partner} displayMode={displayMode} />
                    ))}
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
                </ScrollReveal>
              )
            }
          )}

          {uncategorizedPartners.length > 0 && (
            <ScrollReveal disabled={!animationsEnabled}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {(showAllUncategorized
                  ? uncategorizedPartners
                  : uncategorizedPartners.slice(0, MAX_VISIBLE)
                ).map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} displayMode={displayMode} />
                ))}
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
            </ScrollReveal>
          )}

          {!hasAnyPartners && (
            <p className="text-center text-muted-foreground py-8">
              {t.cases.empty}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function PartnerCard({
  partner,
  displayMode,
}: {
  partner: Partner
  displayMode: PartnerDisplayMode
}) {
  const hasLogo = Boolean(partner.logo_url)

  const paddingClass =
    displayMode === "logo"
      ? hasLogo
        ? "p-0"
        : "p-6"
      : displayMode === "name"
        ? "p-6"
        : "p-4"

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center rounded-xl border border-border bg-card transition-colors hover:border-primary/30 min-h-[120px]",
        paddingClass,
      )}
    >
      {displayMode === "name" && (
        <span className="text-center text-sm font-medium text-foreground">{partner.name}</span>
      )}

      {displayMode === "logo" && (
        <>
          {hasLogo ? (
            <div className="flex h-16 w-full items-center justify-center">
              <img
                src={`/api/content/partners/${partner.id}/logo`}
                alt={partner.name}
                title={partner.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ) : (
            <span className="text-center text-sm font-medium text-foreground">
              {partner.name}
            </span>
          )}
        </>
      )}

      {displayMode === "logoAndName" && (
        <div className="flex flex-col items-center justify-center gap-2">
          {hasLogo && (
            <div className="flex h-16 w-full items-center justify-center">
              <img
                src={`/api/content/partners/${partner.id}/logo`}
                alt={partner.name}
                title={partner.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          )}
          <span className="text-center text-xs font-medium text-foreground">{partner.name}</span>
        </div>
      )}
    </div>
  )
}
