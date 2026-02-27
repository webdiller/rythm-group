"use client"

import { useLocale } from "@/lib/locale-context"

export function Footer() {
  const { t } = useLocale()

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div>
            <a href="#" className="flex items-center justify-center md:justify-start gap-2" aria-label="Rythm Group Home">
            <span className="text-lg font-bold tracking-tight flex items-center gap-2 text-foreground">
              <div className="rounded-full overflow-hidden bg-primary"><img src="./logo.jpg" alt="Rythm Group" className="h-8 w-8" /></div>
              <span>Rythm<span className="text-primary">Group</span></span>
            </span>
          </a>
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
