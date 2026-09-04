"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import { createAnchorClickHandler } from "@/lib/anchor-nav"
import { normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"
import { resolveNavHref } from "@/lib/nav-hrefs"
import { WISHLISTS_BASE_PATH } from "@/lib/wishlists-path"

export type SiteSettings = {
  logo_text?: string | null
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
  headerNavOrder?: string | null
  heroAnimationEnabled?: boolean | null
  partnersDisplayMode?: "name" | "logo" | "logoAndName" | null
  channels_show_subscribers?: boolean | null
  channels_show_reach?: boolean | null
  channels_card_align?: "left" | "center" | "right" | null
  contactLayout?: "formFirst" | "contactsFirst" | null
  contactFormHidden?: boolean | null
  page_blog_enabled?: boolean | null
  page_affiliate_enabled?: boolean | null
}

type FooterProps = {
  siteSettings?: SiteSettings | null
  sectionHrefPrefix?: "" | "/"
  /** Direct prop override — falls back to siteSettings.page_blog_enabled. Default true. */
  pageBlogEnabled?: boolean
  /** Direct prop override — falls back to siteSettings.page_affiliate_enabled. Default true. */
  pageAffiliateEnabled?: boolean
}

export function Footer({ siteSettings, sectionHrefPrefix = "", pageBlogEnabled, pageAffiliateEnabled }: FooterProps) {
  const { t } = useLocale()

  const navItemById: Record<HeaderNavItemId, { label: string; href: string }> = {
    about: { label: t.nav.about, href: "#about" },
    channels: { label: t.nav.channels, href: "#channels" },
    cases: { label: t.nav.cases, href: "#cases" },
    affiliate: { label: t.nav.affiliate, href: WISHLISTS_BASE_PATH },
    blog: { label: t.nav.blog ?? t.blog.navLabel, href: "/blog" },
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

  const blogEnabled = pageBlogEnabled ?? (siteSettings?.page_blog_enabled !== false)
  const affiliateEnabled = pageAffiliateEnabled ?? (siteSettings?.page_affiliate_enabled !== false)

  const navItems = navOrder
    .filter((id) => !(id === "blog" && !blogEnabled))
    .filter((id) => !(id === "affiliate" && !affiliateEnabled))
    .map((id) => navItemById[id])

  const homeHref = sectionHrefPrefix === "/" ? "/" : "#"
  const contactHref = resolveNavHref("#contact", sectionHrefPrefix)
  const handleNavClick = (rawHref: string) =>
    createAnchorClickHandler({ rawHref, sectionHrefPrefix })

  const privacyUrl = siteSettings?.privacyPolicyUrl ?? null
  const dataPolicyUrl = siteSettings?.dataProcessingPolicyUrl ?? null
  const logoText = siteSettings?.logo_text?.trim() ?? ""

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
                  <div className="overflow-hidden rounded-full">
                    <img src="/api/site/logo" width={32} height={32} alt="Rythm Group" className="h-8 w-8 object-cover" />
                  </div>
                  {logoText ? <span>{logoText}</span> : null}
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
                onClick={handleNavClick(item.href)}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

            {/* TODO: Remove it if no need */}
          {/*<div className="max-w-sm space-y-3 md:text-left md:order-1">
            <p className="text-sm font-medium text-foreground">{t.footer.ctaTitle}</p>
             <Link
              href={contactHref}
              onClick={handleNavClick("#contact")}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {t.nav.order}
            </Link>
          </div> */}
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
