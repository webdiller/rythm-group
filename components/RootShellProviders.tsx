"use client"

import type { ReactNode } from "react"
import { LocaleProvider } from "@/lib/locale-context"
import { PageRouteTransitionProvider } from "@/components/page-route-transition-provider"
import { SiteShell } from "@/components/SiteShell"
import type { Translations } from "@/lib/i18n"

type RootShellProvidersProps = {
  children: ReactNode
  hasAnyCustomBackgrounds: boolean
  initialTranslations: Translations
}

/** Один раз на всё приложение: локаль + предзагрузка фонов без перемонтирования при навигации. */
export function RootShellProviders({
  children,
  hasAnyCustomBackgrounds,
  initialTranslations,
}: RootShellProvidersProps) {
  return (
    <LocaleProvider initialLocale="ru" initialTranslations={initialTranslations}>
      <PageRouteTransitionProvider>
        <SiteShell hasAnyCustomBackgrounds={hasAnyCustomBackgrounds}>{children}</SiteShell>
      </PageRouteTransitionProvider>
    </LocaleProvider>
  )
}
