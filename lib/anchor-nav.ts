import type { MouseEvent } from "react"
import { resolveNavHref } from "@/lib/nav-hrefs"

export function scrollToSection(sectionId: string, behavior: ScrollBehavior = "smooth"): boolean {
  if (!sectionId) return false
  const el = document.getElementById(sectionId)
  if (!el) return false
  el.scrollIntoView({ behavior, block: "start" })
  return true
}

export function updateLocationHash(hash: string) {
  const normalized = hash.startsWith("#") ? hash : `#${hash}`
  if (window.location.hash !== normalized) {
    window.history.replaceState(null, "", normalized)
  }
}

export function scrollToHash(hash: string, behavior: ScrollBehavior = "auto"): boolean {
  const sectionId = hash.startsWith("#") ? hash.slice(1) : hash
  if (!sectionId) return false
  const scrolled = scrollToSection(sectionId, behavior)
  if (scrolled) {
    updateLocationHash(`#${sectionId}`)
  }
  return scrolled
}

const MAX_HASH_SCROLL_ATTEMPTS = 60

/** Повторяет скролл к якорю, пока секция не появится в DOM (после client navigation). */
export function scrollToHashWhenReady(hash: string, behavior: ScrollBehavior = "auto", onDone?: () => void): () => void {
  const sectionId = hash.startsWith("#") ? hash.slice(1) : hash
  if (!sectionId) {
    onDone?.()
    return () => {}
  }

  let frameId = 0
  let attempts = 0

  const tryScroll = () => {
    attempts += 1
    if (scrollToHash(`#${sectionId}`, behavior) || attempts >= MAX_HASH_SCROLL_ATTEMPTS) {
      onDone?.()
      return
    }
    frameId = window.requestAnimationFrame(tryScroll)
  }

  frameId = window.requestAnimationFrame(tryScroll)

  return () => {
    window.cancelAnimationFrame(frameId)
  }
}

type AnchorClickOptions = {
  rawHref: string
  sectionHrefPrefix?: "" | "/"
  onDone?: () => void
}

export function createAnchorClickHandler({ rawHref, sectionHrefPrefix = "", onDone }: AnchorClickOptions) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (onDone) onDone()

    const resolvedHref = resolveNavHref(rawHref, sectionHrefPrefix)

    try {
      const targetUrl = new URL(resolvedHref, window.location.origin)
      const samePath = targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search

      if (samePath && targetUrl.hash) {
        const sectionId = targetUrl.hash.slice(1)
        const el = document.getElementById(sectionId)
        if (el) {
          event.preventDefault()
          scrollToSection(sectionId)
          updateLocationHash(targetUrl.hash)
          return
        }
      }
    } catch {
      // ignore malformed URLs
    }

    if (rawHref.startsWith("#")) {
      const sectionId = rawHref.slice(1)
      if (!sectionId) return
      const el = document.getElementById(sectionId)
      if (el) {
        event.preventDefault()
        scrollToSection(sectionId)
        updateLocationHash(rawHref)
        return
      }
    }

    if (rawHref.startsWith("#")) return

    const targetUrl = new URL(resolvedHref, window.location.origin)
    const isSameRoute = targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search && targetUrl.hash === window.location.hash

    if (isSameRoute) {
      event.preventDefault()
      if (targetUrl.hash) {
        scrollToHash(targetUrl.hash)
      } else {
        window.location.assign(targetUrl.toString())
      }
    }
  }
}
