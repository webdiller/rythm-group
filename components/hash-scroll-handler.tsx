"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { scrollToHashWhenReady } from "@/lib/anchor-nav"

/** Скролл к якорю после загрузки/навигации (прямые ссылки вида /#contact). */
export function HashScrollHandler() {
	const pathname = usePathname()

	useEffect(() => {
		const hash = window.location.hash
		if (!hash || hash.length <= 1) return
		return scrollToHashWhenReady(hash, "auto")
	}, [pathname])

	return null
}
