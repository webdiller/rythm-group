"use client"

import { useLocale } from "@/lib/locale-context"

export function Footer() {
  const { t } = useLocale()

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-xs font-bold text-primary-foreground">RG</span>
          </div>
          <div>
            <span className="block text-sm font-semibold text-foreground">
              Rythm<span className="text-primary">Group</span>
            </span>
            <span className="text-xs text-muted-foreground">{t.footer.description}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Rythm Group. {t.footer.rights}.
        </p>
      </div>
    </footer>
  )
}
