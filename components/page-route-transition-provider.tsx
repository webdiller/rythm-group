"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "@/lib/locale-context"

type PageRouteTransitionProviderProps = {
  children: ReactNode
}

type TransitionPhase = "idle" | "covering" | "navigating" | "revealing"

const COVER_DELAY_MS = 400
const POST_SCROLL_SETTLE_MS = 120
const HIDE_DELAY_MS = 620

function normalizePathname(pathname: string): string {
  if (!pathname) return "/"
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1)
  return pathname
}

function isAnimatedDestination(pathname: string): boolean {
  return pathname === "/affiliate" || pathname === "/blog"
}

function isAnimatedTransition(fromPathname: string, toPathname: string): boolean {
  return fromPathname === "/" && isAnimatedDestination(toPathname)
}

export function PageRouteTransitionProvider({ children }: PageRouteTransitionProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const normalizedPathname = useMemo(() => normalizePathname(pathname ?? "/"), [pathname])
  const { t } = useLocale()

  const [phase, setPhase] = useState<TransitionPhase>("idle")
  const [targetPathname, setTargetPathname] = useState<string | null>(null)
  const [targetLabel, setTargetLabel] = useState("")

  useEffect(() => {
    if (phase === "idle") return

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      if (anchor.dataset.noRouteTransition === "true") return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      const nextPathname = normalizePathname(url.pathname)
      if (!isAnimatedTransition(normalizedPathname, nextPathname)) return
      if (nextPathname === normalizedPathname) return

      event.preventDefault()
    }

    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [phase, normalizedPathname])

  useEffect(() => {
    const onClickCapture = (event: MouseEvent) => {
      if (phase !== "idle") return
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      if (anchor.dataset.noRouteTransition === "true") return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return

      const nextPathname = normalizePathname(url.pathname)
      if (!isAnimatedTransition(normalizedPathname, nextPathname)) return
      if (nextPathname === normalizedPathname) return

      const nextHref = `${url.pathname}${url.search}${url.hash}`
      event.preventDefault()

      setTargetPathname(nextPathname)
      setTargetLabel(nextPathname === "/blog" ? (t.nav.blog ?? t.blog.navLabel) : t.nav.affiliate)
      setPhase("covering")

      window.setTimeout(() => {
        setPhase("navigating")
        router.push(nextHref)
      }, COVER_DELAY_MS)
    }

    document.addEventListener("click", onClickCapture, true)
    return () => document.removeEventListener("click", onClickCapture, true)
  }, [phase, normalizedPathname, router, t.blog.navLabel, t.nav.affiliate, t.nav.blog])

  useEffect(() => {
    if (phase !== "navigating") return
    if (!targetPathname) return
    if (normalizedPathname !== targetPathname) return

    let frameId = 0
    let revealTimer = 0
    let attempts = 0
    const MAX_ATTEMPTS = 60

    const ensureTopAndReveal = () => {
      attempts += 1
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
      const atTop = Math.abs(window.scrollY) <= 1

      if (atTop || attempts >= MAX_ATTEMPTS) {
        revealTimer = window.setTimeout(() => {
          setPhase("revealing")
        }, POST_SCROLL_SETTLE_MS)
        return
      }

      frameId = window.requestAnimationFrame(ensureTopAndReveal)
    }

    frameId = window.requestAnimationFrame(ensureTopAndReveal)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(revealTimer)
    }
  }, [phase, normalizedPathname, targetPathname])

  useEffect(() => {
    if (phase !== "revealing") return

    const hideTimer = window.setTimeout(() => {
      setPhase("idle")
      setTargetPathname(null)
      setTargetLabel("")
    }, HIDE_DELAY_MS)

    return () => window.clearTimeout(hideTimer)
  }, [phase])

  useEffect(() => {
    const shouldLock = phase !== "idle"
    const htmlEl = document.documentElement
    const bodyEl = document.body
    const prevHtmlOverflow = htmlEl.style.overflow
    const prevBodyOverflow = bodyEl.style.overflow
    const prevBodyTouchAction = bodyEl.style.touchAction

    if (shouldLock) {
      htmlEl.style.overflow = "hidden"
      bodyEl.style.overflow = "hidden"
      bodyEl.style.touchAction = "none"
    }

    return () => {
      htmlEl.style.overflow = prevHtmlOverflow
      bodyEl.style.overflow = prevBodyOverflow
      bodyEl.style.touchAction = prevBodyTouchAction
    }
  }, [phase])

  const overlayVisible = phase !== "idle"
  const overlayCovering = phase === "covering" || phase === "navigating"
  const overlayRevealing = phase === "revealing"

  return (
    <>
      {children}
      <div
        className={`route-transition-overlay ${overlayVisible ? "is-visible" : ""} ${overlayCovering ? "is-covering" : ""} ${overlayRevealing ? "is-revealing" : ""}`}
        aria-hidden={!overlayVisible}
      >
      </div>
    </>
  )
}
