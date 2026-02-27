"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/locale-context"

type SiteSettings = {
  privacyPolicyUrl?: string | null
  dataProcessingPolicyUrl?: string | null
}

export function Footer() {
  const { t } = useLocale()
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/site/settings")
        if (!response.ok) return

        const json = (await response.json()) as { data?: SiteSettings | null }
        setSiteSettings(json.data ?? null)
      } catch {
        // Ignore errors – footer works without external links
      }
    }

    void loadSettings()
  }, [])

  const navItems = [
    { label: t.nav.about, href: "#about" },
    { label: t.nav.channels, href: "#channels" },
    { label: t.nav.cases, href: "#cases" },
    { label: t.nav.contacts, href: "#contact" },
  ]

  const privacyUrl = siteSettings?.privacyPolicyUrl ?? null
  const dataPolicyUrl = siteSettings?.dataProcessingPolicyUrl ?? null

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3 md:order-3">
            <div>
              <a
                href="#"
                className="flex items-center justify-center gap-2 md:justify-end"
                aria-label="Rythm Group Home"
              >
                <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                  <div className="overflow-hidden rounded-full bg-primary">
                    <img src="./logo.jpg" alt="Rythm Group" className="h-8 w-8" />
                  </div>
                  <span>
                    Rythm<span className="text-primary">Group</span>
                  </span>
                </div>
              </a>
              <span className="mt-2 block text-xs text-muted-foreground">{t.footer.description}</span>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground md:justify-center md:order-2">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="max-w-sm space-y-3 md:text-left md:order-1">
            <p className="text-sm font-medium text-foreground">{t.footer.ctaTitle}</p>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {t.nav.order}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Rythm Group. {t.footer.rights}.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {privacyUrl && (
              <a
                href={privacyUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t.footer.privacy}
              </a>
            )}
            {dataPolicyUrl && (
              <a
                href={dataPolicyUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {t.footer.dataPolicy}
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
