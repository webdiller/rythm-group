"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import { normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"
import { resolveNavHref } from "@/lib/nav-hrefs"
import imgLogo from "@/public/logo.jpg"

export type SiteSettings = {
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
  headerNavOrder?: string | null
  heroAnimationEnabled?: boolean | null
  partnersDisplayMode?: "name" | "logo" | "logoAndName" | null
  contactLayout?: "formFirst" | "contactsFirst" | null
  contactFormHidden?: boolean | null
}

type FooterProps = {
  siteSettings?: SiteSettings | null
  sectionHrefPrefix?: "" | "/"
}

export function Footer({ siteSettings, sectionHrefPrefix = "" }: FooterProps) {
  const { t } = useLocale()

  const navItemById: Record<HeaderNavItemId, { label: string; href: string }> = {
    about: { label: t.nav.about, href: "#about" },
    channels: { label: t.nav.channels, href: "#channels" },
    cases: { label: t.nav.cases, href: "#cases" },
    affiliate: { label: t.nav.affiliate, href: "/affiliate" },
    blog: { label: t.blog.navLabel, href: "/blog" },
    contacts: { label: t.nav.contacts, href: "#contact" },
  }

  const navOrder = (() => {
    try {
      return normalizeHeaderNavOrder(
        siteSettings?.headerNavOrder ? JSON.parse(siteSettings.headerNavOrder) : undefined,
      )
    } catch {
      return normalizeHeaderNavOrder(undefined)
    }
  })()

  const navItems = navOrder.map((id) => navItemById[id])

  const homeHref = sectionHrefPrefix === "/" ? "/" : "#"
  const contactHref = resolveNavHref("#contact", sectionHrefPrefix)

  const privacyUrl = siteSettings?.privacyPolicyUrl ?? null
  const dataPolicyUrl = siteSettings?.dataProcessingPolicyUrl ?? null

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3 md:order-3">
            <div>
              <Link
                href={homeHref === "#" ? "/" : homeHref}
                className="flex items-center justify-center gap-2 md:justify-end"
                aria-label="Rythm Group Home"
              >
                <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                  <div className="overflow-hidden rounded-full bg-primary">
                    <img src={imgLogo.src} width={imgLogo.width} height={imgLogo.height} alt="Rythm Group" className="h-8 w-8" />
                  </div>
                  <span>
                    Rythm<span className="text-primary">Group</span>
                  </span>
                </div>
              </Link>
              <span className="mt-2 block text-xs text-muted-foreground">{t.footer.description}</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-center md:order-2">
            {navItems.map((item) => (
              <Link
                key={item.label + item.href}
                href={resolveNavHref(item.href, sectionHrefPrefix)}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="max-w-sm space-y-3 md:text-left md:order-1">
            <p className="text-sm font-medium text-foreground">{t.footer.ctaTitle}</p>
            <Link
              href={contactHref}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {t.nav.order}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            {t.footer.rights}.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {privacyUrl && (
              <Link
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t.footer.privacy}
              </Link>
            )}
            {dataPolicyUrl && (
              <Link
                href={dataPolicyUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t.footer.dataPolicy}
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
