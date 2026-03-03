"use client"

import { useLocale } from "@/lib/locale-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"

export function Stats({ animationsEnabled = true }: { animationsEnabled?: boolean }) {
  const { t } = useLocale()

  return (
    <section className="relative px-6 py-12 md:py-16">
      {/* Background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t.stats.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
              {t.stats.subtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-6 md:grid-cols-4">
          {t.stats.items.map((item, i) => (
            <ScrollStagger key={i} index={i} delayStep={100} disabled={!animationsEnabled}>
              <div className="flex flex-col items-center rounded-xl border border-border bg-card p-8 text-center transition-all hover:border-primary/30 glow-border">
                <span className="mb-2 text-3xl font-bold text-primary md:text-4xl lg:text-5xl text-glow">
                  {item.value}
                </span>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            </ScrollStagger>
          ))}
        </div>
      </div>
    </section>
  )
}
