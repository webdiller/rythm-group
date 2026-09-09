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
 * Карточка партнёра на главной: фиксированный слот логотипа → одинаковый размер ячеек.
 */
export function LandingPartnerCard({ partner, displayMode = "logoAndName" }: LandingPartnerCardProps) {
  const logoSrc = getPartnerLogoSrc(partner)
  const hasLogo = Boolean(logoSrc)
  const showLogo = displayMode !== "name" && hasLogo
  const showName = displayMode !== "logo" || !hasLogo
  const href = partner.target_url?.trim() || null

  const nameOnly = !showLogo && showName

  const inner = (
    <>
      {showLogo && logoSrc ? (
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-3">
          <img
            src={logoSrc}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-md"
            loading="lazy"
            decoding="async"
          />
          <img
            src={logoSrc}
            alt={partner.name}
            title={partner.name}
            className="relative z-10 h-full w-full rounded-lg object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {showName ? (
        <span
          className={clsx("line-clamp-2 text-center text-sm font-medium leading-snug text-foreground", showLogo && "mt-3", nameOnly && "flex flex-1 items-center justify-center px-1")}
          title={partner.name}
        >
          {partner.name}
        </span>
      ) : null}
    </>
  )

  const className = clsx(
    "flex h-full w-full flex-col items-center rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30",
    nameOnly ? "justify-center" : "justify-start",
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
