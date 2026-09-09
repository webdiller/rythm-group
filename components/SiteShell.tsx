"use client"

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react"

type SiteShellProps = {
	children: ReactNode
	hasAnyCustomBackgrounds: boolean
	prefetchBackgroundSrcs?: string[]
}

const PREFETCH_DONE_KEY = "__rg_site_shell_bg_prefetch_done"

function readPrefetchDone(): boolean {
	if (typeof window === "undefined") return false
	try {
		return sessionStorage.getItem(PREFETCH_DONE_KEY) === "1"
	} catch {
		return false
	}
}

function writePrefetchDone() {
	if (typeof window === "undefined") return
	try {
		sessionStorage.setItem(PREFETCH_DONE_KEY, "1")
	} catch {
		/* private mode / quota */
	}
}

export function SiteShell({ children, hasAnyCustomBackgrounds, prefetchBackgroundSrcs = [] }: SiteShellProps) {
	const [ready, setReady] = useState(() => !hasAnyCustomBackgrounds)

	/** После первой успешной загрузки фиксируем в sessionStorage — при перемонтировании (навигация) не показываем спиннер снова. */
	useLayoutEffect(() => {
		if (!hasAnyCustomBackgrounds) {
			writePrefetchDone()
			setReady(true)
			return
		}
		if (readPrefetchDone()) {
			setReady(true)
		}
	}, [hasAnyCustomBackgrounds])

	useEffect(() => {
		if (!hasAnyCustomBackgrounds) return
		if (readPrefetchDone()) return

		const sources = prefetchBackgroundSrcs.length > 0 ? prefetchBackgroundSrcs : ["/backgrounds/global-light.webp", "/backgrounds/global-dark.webp", "/backgrounds/hero-light.webp", "/backgrounds/hero-dark.webp"]

		let completed = 0
		const onDone = () => {
			completed += 1
			if (completed >= sources.length) {
				writePrefetchDone()
				setReady(true)
			}
		}

		const images = sources.map((src) => {
			const img = new Image()
			img.onload = onDone
			img.onerror = onDone
			img.src = src
			return img
		})

		return () => {
			images.forEach((img) => {
				img.onload = null
				img.onerror = null
			})
		}
	}, [hasAnyCustomBackgrounds, prefetchBackgroundSrcs])

	if (!ready) {
		return (
			<div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
				<div className="flex flex-col items-center gap-3">
					<div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
					<p className="text-sm text-muted-foreground">Загрузка…</p>
				</div>
			</div>
		)
	}

	return <>{children}</>
}
