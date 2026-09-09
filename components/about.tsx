"use client"

import { useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"
import { getAboutCardIcon } from "@/lib/about-card-icons"
import type { AboutCardListItem } from "@/lib/schemas/about-cards"
import { getAboutIconSrc } from "@/lib/s3/about-icon-url"

type DisplayCard = {
  key: string
  id?: number
  iconName: string
  hasCustomIcon: boolean
  iconSrc: string | null
  title: string
  text: string
}

export function About({
  animationsEnabled = true,
  cards,
}: {
  animationsEnabled?: boolean
  /** Карточки из CMS; если пусто — fallback из переводов `t.about.*` */
  cards?: AboutCardListItem[] | null
}) {
  const { t, locale } = useLocale()

  const displayCards: DisplayCard[] = useMemo(() => {
    const fromDb = (cards ?? []).filter((c) => !c.hidden)
    if (fromDb.length > 0) {
      return fromDb.map((c) => ({
        key: String(c.id),
        id: c.id,
        iconName: c.icon,
        hasCustomIcon: c.has_custom_icon,
        iconSrc: getAboutIconSrc(c),
        title: locale === "en" ? c.title_en : c.title_ru,
        text: locale === "en" ? c.text_en : c.text_ru,
      }))
    }
    return [
      {
        key: "mission",
        iconName: "Target",
        hasCustomIcon: false,
        iconSrc: null,
        title: t.about.mission.title,
        text: t.about.mission.text,
      },
      {
        key: "team",
        iconName: "Users",
        hasCustomIcon: false,
        iconSrc: null,
        title: t.about.team.title,
        text: t.about.team.text,
      },
      {
        key: "audience",
        iconName: "Crosshair",
        hasCustomIcon: false,
        iconSrc: null,
        title: t.about.audience.title,
        text: t.about.audience.text,
      },
    ]
  }, [cards, locale, t.about])

  return (
    <section
      id="about"
      className="relative px-6 py-12 md:py-16"
    >
      <div className="mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">{t.about.title}</h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">{t.about.subtitle}</p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {displayCards.map((card, index) => {
            const Icon = getAboutCardIcon(card.iconName)
            return (
              <ScrollStagger
                className="h-full [&>div]:h-full"
                key={card.key}
                index={index}
                delayStep={120}
                disabled={!animationsEnabled}
              >
                <div className="group rounded-xl h-full border border-border bg-card p-8 transition-all hover:border-primary/30 glow-border">
                  <div className="mb-5 flex mx-auto h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    {card.hasCustomIcon && card.iconSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- динамический URL из CMS
                      <img
                        src={card.iconSrc}
                        alt=""
                        className="h-6 w-6 object-contain"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <h3 className="mb-3 text-lg sm:text-xl lg:text-2xl text-center font-semibold text-card-foreground">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.text}</p>
                </div>
              </ScrollStagger>
            )
          })}
        </div>
      </div>
    </section>
  )
}
