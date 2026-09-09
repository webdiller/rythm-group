/**
 * Слоты фонов сайта (hero / global × theme × scope).
 * Client-safe.
 */
import { getNextPublicYaPublicBase, getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"

export const BACKGROUND_SLOTS = ["hero", "hero_light", "hero_dark", "hero_affiliate", "hero_affiliate_light", "hero_affiliate_dark", "global", "global_light", "global_dark", "global_affiliate", "global_affiliate_light", "global_affiliate_dark"] as const

export type BackgroundSlot = (typeof BACKGROUND_SLOTS)[number]

export type BackgroundKind = "hero" | "global"

export type BackgroundsMap = Partial<Record<BackgroundSlot, string>>

export function resolveBackgroundSlot(kind: BackgroundKind, theme?: string | null, scope?: string | null): BackgroundSlot {
  const affiliate = scope === "affiliate"
  if (kind === "hero") {
    if (theme === "light") return affiliate ? "hero_affiliate_light" : "hero_light"
    if (theme === "dark") return affiliate ? "hero_affiliate_dark" : "hero_dark"
    return affiliate ? "hero_affiliate" : "hero"
  }
  if (theme === "light") return affiliate ? "global_affiliate_light" : "global_light"
  if (theme === "dark") return affiliate ? "global_affiliate_dark" : "global_dark"
  return affiliate ? "global_affiliate" : "global"
}

/** Имя файла на диске `public/backgrounds/` (legacy). */
export function backgroundSlotToFilename(slot: BackgroundSlot): string {
  return `${slot.replace(/_/g, "-")}.webp`
}

export function isBackgroundS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith("site/backgrounds/") && v.length < 1024
}

export function parseBackgroundsJson(raw: string | null | undefined): BackgroundsMap {
  if (!raw?.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const out: BackgroundsMap = {}
    for (const slot of BACKGROUND_SLOTS) {
      const v = (parsed as Record<string, unknown>)[slot]
      if (typeof v === "string" && isBackgroundS3Key(v)) out[slot] = v.trim()
    }
    return out
  } catch {
    return {}
  }
}

export function serializeBackgroundsMap(map: BackgroundsMap): string {
  const cleaned: BackgroundsMap = {}
  for (const slot of BACKGROUND_SLOTS) {
    const v = map[slot]
    if (v && isBackgroundS3Key(v)) cleaned[slot] = v.trim()
  }
  return JSON.stringify(cleaned)
}

/**
 * Публичный URL фона: S3-ключ → public base; иначе static `/backgrounds/{slot}.webp`.
 */
export function getBackgroundSrc(
  kind: BackgroundKind,
  options?: {
    theme?: string | null
    scope?: string | null
    key?: string | null
    cacheBust?: string | number
  },
): string {
  const theme = options?.theme
  const scope = options?.scope
  const key = options?.key?.trim()
  const slot = resolveBackgroundSlot(kind, theme, scope)

  let src: string
  if (key && isBackgroundS3Key(key)) {
    const base = getNextPublicYaPublicBase()
    src = base ? getPublicObjectUrlFromBase(base, key) : `/backgrounds/${backgroundSlotToFilename(slot)}`
  } else {
    src = `/backgrounds/${backgroundSlotToFilename(slot)}`
  }

  if (options?.cacheBust != null && options.cacheBust !== "") {
    const sep = src.includes("?") ? "&" : "?"
    return `${src}${sep}ts=${options.cacheBust}`
  }
  return src
}
