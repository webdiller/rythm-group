"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from "lucide-react"

export function Header() {
  const { locale, setLocale, t } = useLocale()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: t.nav.about, href: "#about" },
    { label: t.nav.channels, href: "#channels" },
    { label: t.nav.cases, href: "#cases" },
    { label: t.nav.contacts, href: "#contact" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#" className="flex items-center gap-2" aria-label="Rythm Group Home">
          <span className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
            <div className="rounded-full overflow-hidden bg-primary"><img src="./logo.jpg" alt="Rythm Group" className="h-8 w-8" /></div>
            Rythm<span className="text-primary">Group</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
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

          <a
            href="#contact"
            className="hidden rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 sm:inline-flex"
          >
            {t.nav.order}
          </a>

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
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {t.nav.order}
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
