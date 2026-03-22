"use client"

import type { ReactNode } from "react"
import { LocaleProvider } from "@/lib/locale-context"
import { SiteShell } from "@/components/SiteShell"

type RootShellProvidersProps = {
  children: ReactNode
  hasAnyCustomBackgrounds: boolean
}

/** Один раз на всё приложение: локаль + предзагрузка фонов без перемонтирования при навигации. */
export function RootShellProviders({ children, hasAnyCustomBackgrounds }: RootShellProvidersProps) {
  return (
    <LocaleProvider>
      <SiteShell hasAnyCustomBackgrounds={hasAnyCustomBackgrounds}>{children}</SiteShell>
    </LocaleProvider>
  )
}
