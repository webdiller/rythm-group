"use client"

import { useLocale } from "@/lib/locale-context"
import { Target, Users, Crosshair } from "lucide-react"

export function About() {
  const { t } = useLocale()

  const cards = [
    {
      icon: Target,
      title: t.about.mission.title,
      text: t.about.mission.text,
    },
    {
      icon: Users,
      title: t.about.team.title,
      text: t.about.team.text,
    },
    {
      icon: Crosshair,
      title: t.about.audience.title,
      text: t.about.audience.text,
    },
  ]

  return (
    <section id="about" className="relative px-6 py-24 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center md:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t.about.title}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
            {t.about.subtitle}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="group rounded-xl border border-border bg-card p-8 transition-all hover:border-primary/30 glow-border"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <card.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-card-foreground">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
