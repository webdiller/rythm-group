"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

interface PartnerCategory {
  id: number
  name: string
  order_index: number
}

interface Partner {
  id: number
  category_id: number | null
  name: string
  logo_url: string | null
  order_index: number
}

export function Cases() {
  const { t } = useLocale()
  const [categories, setCategories] = useState<PartnerCategory[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, partRes] = await Promise.all([
          fetch("/api/content/partner-categories"),
          fetch("/api/content/partners"),
        ])
        if (catRes.ok) {
          const json = (await catRes.json()) as { data?: PartnerCategory[] }
          setCategories(json.data ?? [])
        }
        if (partRes.ok) {
          const json = (await partRes.json()) as { data?: Partner[] }
          setPartners(json.data ?? [])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categoriesOrdered = [...categories].sort((a, b) => a.order_index - b.order_index)
  const partnersByCategory = categoriesOrdered.map((cat) => ({
    category: cat,
    partners: partners
      .filter((p) => p.category_id === cat.id)
      .sort((a, b) => a.order_index - b.order_index),
  }))

  return (
    <section id="cases" className="relative px-6 py-24 md:py-32">
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

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : (
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
                          className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30 min-h-[120px]"
                        >
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt=""
                              className="max-h-16 w-full object-contain"
                            />
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
            {!partnersByCategory.some((g) => g.partners.length > 0) && !loading && (
              <p className="text-center text-muted-foreground py-8">
                {t.cases.empty}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
