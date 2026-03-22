"use client"

import Link from "next/link"
import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { resolveNavHref } from "@/lib/nav-hrefs"
import { Menu, X } from "lucide-react"

type HeaderProps = {
  /** На подстраницах (`/blog`, будущий `/affiliate`) якоря ведут на главную: `/#section`. */
  sectionHrefPrefix?: "" | "/"
}

export function Header({ sectionHrefPrefix = "" }: HeaderProps) {
  const { locale, setLocale, t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: t.nav.about, href: "#about" },
    { label: t.nav.channels, href: "#channels" },
    { label: t.nav.cases, href: "#cases" },
    { label: t.nav.contacts, href: "#contact" },
    { label: t.blog.navLabel, href: "/blog" },
  ]

  const homeHref = sectionHrefPrefix === "/" ? "/" : "#"
  const contactHref = resolveNavHref("#contact", sectionHrefPrefix)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-4 sm:px-4">
        <Link
          href={homeHref === "#" ? "/" : homeHref}
          className="flex items-center gap-2"
          aria-label="Rythm Group Home"
        >
          <span className="text-lg font-bold tracking-tight flex items-center gap-1 sm:gap-2 text-foreground">
            <div className="rounded-full overflow-hidden bg-primary">
              <img src="./logo.jpg" alt="Rythm Group" className="h-8 w-8" />
            </div>
            <span className="text-xs sm:text-sm md:text-base">Rythm<span className="text-primary">Group</span></span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.label + item.href}
              href={resolveNavHref(item.href, sectionHrefPrefix)}
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
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={contactHref}
              onClick={() => setMobileOpen(false)}
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
