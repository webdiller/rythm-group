"use client"

import Link from "next/link"
import { useState } from "react"
import type { MouseEvent } from "react"
import { useLocale } from "@/lib/locale-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { resolveNavHref } from "@/lib/nav-hrefs"
import { Menu, X } from "lucide-react"
import { DEFAULT_HEADER_NAV_ORDER, normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"

type HeaderProps = {
  /** На подстраницах (`/blog`, `/affiliate`) якоря ведут на главную: `/#section`. */
  sectionHrefPrefix?: "" | "/"
  /** Порядок пунктов меню, вычисленный на сервере. */
  navOrder?: HeaderNavItemId[]
  /** Текст рядом с логотипом. Если пусто, скрывается. */
  logoText?: string | null
}

export function Header({ sectionHrefPrefix = "", navOrder, logoText }: HeaderProps) {
  const { locale, setLocale, t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)
  const resolvedNavOrder = normalizeHeaderNavOrder(navOrder ?? DEFAULT_HEADER_NAV_ORDER)

  const navById: Record<HeaderNavItemId, { label: string; href: string }> = {
    about: { label: t.nav.about, href: "#about" },
    channels: { label: t.nav.channels, href: "#channels" },
    cases: { label: t.nav.cases, href: "#cases" },
    affiliate: { label: t.nav.affiliate, href: "/affiliate" },
    blog: { label: t.nav.blog ?? t.blog.navLabel, href: "/blog" },
    contacts: { label: t.nav.contacts, href: "#contact" },
  }
  const navItems = resolvedNavOrder.map((id) => navById[id])

  const homeHref = sectionHrefPrefix === "/" ? "/" : "#"
  const contactHref = resolveNavHref("#contact", sectionHrefPrefix)
  const canForceAnchorScroll = sectionHrefPrefix === ""

  const handleAnchorClick = (rawHref: string, onDone?: () => void) => {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (onDone) onDone()
      if (!canForceAnchorScroll) return
      if (!rawHref.startsWith("#")) return

      const id = rawHref.slice(1)
      if (!id) return
      const el = document.getElementById(id)
      if (!el) return

      event.preventDefault()
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      if (window.location.hash !== rawHref) {
        window.history.replaceState(null, "", rawHref)
      }
    }
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background backdrop-blur-xl"
      style={{ right: "var(--route-scrollbar-comp, 0px)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-4 sm:px-4">
        <Link
          href={homeHref === "#" ? "/" : homeHref}
          className="flex items-center gap-2"
          aria-label="Rythm Group Home"
        >
          <span className="text-lg font-bold tracking-tight flex items-center gap-1 sm:gap-2 text-foreground">
            <div className="rounded-full overflow-hidden">
              <img src="/api/site/logo" width={32} height={32} alt="Rythm Group" className="h-8 w-8 object-cover" />
            </div>
            {logoText?.trim() ? (
              <span className="text-xs sm:text-sm md:text-base">{logoText}</span>
            ) : null}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.label + item.href}
              href={resolveNavHref(item.href, sectionHrefPrefix)}
              onClick={handleAnchorClick(item.href)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          <button
            onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
            className="flex h-9 items-center gap-1 rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-border"
            aria-label={`Switch to ${locale === "ru" ? "English" : "Russian"}`}
          >
            <span className={locale === "ru" ? "text-primary" : "text-muted-foreground"}>RU</span>
            <span className="text-border">/</span>
            <span className={locale === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
          </button>

          <Link
            href={contactHref}
            onClick={handleAnchorClick("#contact")}
            className="hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 sm:inline-flex"
          >
            {t.nav.order}
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border bg-background/95 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.label + item.href}
                href={resolveNavHref(item.href, sectionHrefPrefix)}
                onClick={handleAnchorClick(item.href, () => setMobileOpen(false))}
                className="rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={contactHref}
              onClick={handleAnchorClick("#contact", () => setMobileOpen(false))}
              className="mt-2 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {t.nav.order}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
