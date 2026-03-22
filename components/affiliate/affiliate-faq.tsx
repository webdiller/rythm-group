"use client"

import { useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import { AFFILIATE_FAQ_MOCK } from "@/lib/affiliate/mock-data"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function AffiliateFaq() {
  const { locale, t } = useLocale()
  const items = useMemo(
    () => [...AFFILIATE_FAQ_MOCK].sort((a, b) => a.sort_order - b.sort_order),
    [],
  )

  return (
    <section className="border-t border-border/60 py-16 md:pb-24 md:pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.affiliate.faq.title}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.faq.subtitle}</p>
        </div>

        <Accordion type="single" collapsible className="w-full rounded-xl border border-border/80 bg-card/50 px-2 backdrop-blur-sm">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-border/60 px-2">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                {locale === "en" ? item.question_en : item.question_ru}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                {locale === "en" ? item.answer_en : item.answer_ru}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
