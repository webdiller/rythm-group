"use client"

import clsx from "clsx"
import { getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"

export type LandingPartnerDisplayMode = "name" | "logo" | "logoAndName"

type LandingPartnerCardPartner = {
  id: number
  name: string
  logo_url: string | null
  target_url?: string | null
}

type LandingPartnerCardProps = {
  partner: LandingPartnerCardPartner
  displayMode?: LandingPartnerDisplayMode
}

/**
 * Карточка партнёра на главной: крупный логотип + компактная тёмная blur-подложка (~+10%).
 * Подпись под картинкой — только через displayMode (настройки сайта).
 */
export function LandingPartnerCard({ partner, displayMode = "logoAndName" }: LandingPartnerCardProps) {
  const logoSrc = getPartnerLogoSrc(partner)
  const hasLogo = Boolean(logoSrc)
  const showLogo = displayMode !== "name" && hasLogo
  const showName = displayMode !== "logo" || !hasLogo
  const href = partner.target_url?.trim() || null

  const nameOnly = !showLogo && showName
  const logoOnly = showLogo && !showName

  const inner = (
    <>
      {showLogo && logoSrc ? (
        <div className="relative p-1 flex aspect-square w-full min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg">
          {/* Подложка ~на 10% больше логотипа: тёмная, ненасыщенная, без «ореола» на всю карточку */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[5%] overflow-hidden rounded-md sm:inset-[4%]"
          >
            <img
              src={logoSrc}
              alt=""
              className="h-full w-full scale-105 object-cover opacity-80 blur-md brightness-[0.35] saturate-[0.2]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
          <img
            src={logoSrc}
            alt={partner.name}
            title={partner.name}
            className="relative z-10 max-h-[90%] max-w-[90%] rounded-md object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {showName ? (
        <span
          className={clsx(
            "line-clamp-2 text-center text-sm font-medium leading-snug text-foreground",
            showLogo && "mt-2 shrink-0",
            nameOnly && "flex flex-1 items-center justify-center px-1",
          )}
          title={partner.name}
        >
          {partner.name}
        </span>
      ) : null}
    </>
  )

  const className = clsx(
    "flex h-full w-full flex-col items-center rounded-xl border border-border bg-card transition-colors hover:border-primary/30",
    logoOnly ? "justify-center p-1.5 sm:p-2" : nameOnly ? "justify-center p-3" : "justify-start p-2 sm:p-2.5",
    href && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  )

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={partner.name}
      >
        {inner}
      </a>
    )
  }

  return <div className={className}>{inner}</div>
}
