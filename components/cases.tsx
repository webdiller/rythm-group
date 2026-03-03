"use client"

import clsx from "clsx"
import { useLocale } from "@/lib/locale-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

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
}

export function Cases({ categories, partners }: CasesProps) {
  const { t } = useLocale()

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
        <ScrollReveal>
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
            ({ category, partners: categoryPartners }) =>
              categoryPartners.length > 0 && (
                <ScrollReveal key={category.id}>
                  <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {categoryPartners.map((partner) => (
                      <div
                        key={partner.id}
                        className={clsx(
                          "flex flex-col items-center justify-center rounded-xl border border-border bg-card transition-colors hover:border-primary/30 min-h-[120px]",
                          partner.logo_url ? "p-0" : "p-6",
                        )}
                      >
                        {partner.logo_url ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <img
                              src={`/api/content/partners/${partner.id}/logo`}
                              alt={partner.name}
                              className="max-h-16 max-w-full object-contain rounded-xl overflow-hidden"
                            />
                          </div>
                        ) : (
                          <span className="text-center text-sm font-medium text-foreground">
                            {partner.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollReveal>
              )
          )}

          {uncategorizedPartners.length > 0 && (
            <ScrollReveal>
              <h3 className="mb-6 text-xl font-semibold text-foreground md:text-2xl">
                {t.cases.uncategorizedTitle}
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {uncategorizedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className={clsx(
                      "flex flex-col items-center justify-center rounded-xl border border-border bg-card transition-colors hover:border-primary/30 min-h-[120px]",
                      partner.logo_url ? "p-0" : "p-6",
                    )}
                  >
                    {partner.logo_url ? (
                      <div className="flex h-16 w-full items-center justify-center">
                        <img
                          src={`/api/content/partners/${partner.id}/logo`}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <span className="text-center text-sm font-medium text-foreground">
                        {partner.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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
