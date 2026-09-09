"use client"

import type { ReactNode } from "react"
import { LocaleProvider } from "@/lib/locale-context"
import { PageRouteTransitionProvider } from "@/components/page-route-transition-provider"
import { HashScrollHandler } from "@/components/hash-scroll-handler"
import { SiteShell } from "@/components/SiteShell"
import type { Translations } from "@/lib/i18n"

type RootShellProvidersProps = {
	children: ReactNode
	hasAnyCustomBackgrounds: boolean
	prefetchBackgroundSrcs?: string[]
	initialTranslations: Translations
}

/** Один раз на всё приложение: локаль + предзагрузка фонов без перемонтирования при навигации. */
export function RootShellProviders({ children, hasAnyCustomBackgrounds, prefetchBackgroundSrcs, initialTranslations }: RootShellProvidersProps) {
	return (
		<LocaleProvider
			initialLocale="ru"
			initialTranslations={initialTranslations}
		>
			<PageRouteTransitionProvider>
				<HashScrollHandler />
				<SiteShell
					hasAnyCustomBackgrounds={hasAnyCustomBackgrounds}
					prefetchBackgroundSrcs={prefetchBackgroundSrcs}
				>
					{children}
				</SiteShell>
			</PageRouteTransitionProvider>
		</LocaleProvider>
	)
}
