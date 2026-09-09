"use client"

import { useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

type AffiliateFaqItem = {
  id: number
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  hidden: boolean | null
  order_index: number | null
}

type AffiliateFaqProps = {
  items?: AffiliateFaqItem[]
}

export function AffiliateFaq({ items = [] }: AffiliateFaqProps) {
  const { locale, t } = useLocale()
  const visibleItems = useMemo(() => [...items].filter((item) => !item.hidden).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)), [items])

  return (
    <section className="border-t border-border/60 py-16 md:pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.affiliate.faq.title}</h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.faq.subtitle}</p>
        </div>

        <Accordion
          type="single"
          collapsible
          className="w-full rounded-xl border border-border/80 bg-card/50 px-2 backdrop-blur-sm"
        >
          {visibleItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={String(item.id)}
              className="border-border/60 px-2"
            >
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{locale === "en" ? item.question_en : item.question_ru}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">{locale === "en" ? item.answer_en : item.answer_ru}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
