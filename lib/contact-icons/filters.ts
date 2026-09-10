import { z } from "zod"

/** Базовые CSS-фильтры для превью светлой/тёмной темы. */
export const IconCssFiltersSchema = z.object({
  brightness: z.number().min(0).max(300),
  contrast: z.number().min(0).max(300),
  saturate: z.number().min(0).max(300),
  invert: z.number().min(0).max(100),
  hueRotate: z.number().min(0).max(360),
  opacity: z.number().min(0).max(100),
})

export type IconCssFilters = z.infer<typeof IconCssFiltersSchema>

export const DEFAULT_ICON_FILTERS: IconCssFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  invert: 0,
  hueRotate: 0,
  opacity: 100,
}

export function parseIconFilters(raw: string | null | undefined): IconCssFilters {
  if (!raw?.trim()) return { ...DEFAULT_ICON_FILTERS }
  try {
    const parsed = IconCssFiltersSchema.safeParse(JSON.parse(raw))
    if (parsed.success) return parsed.data
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_ICON_FILTERS }
}

export function serializeIconFilters(filters: IconCssFilters | null | undefined): string {
  return JSON.stringify(filters ?? DEFAULT_ICON_FILTERS)
}

export function iconFiltersToCss(filters: IconCssFilters | null | undefined): string {
  const f = { ...DEFAULT_ICON_FILTERS, ...(filters ?? {}) }
  return [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturate}%)`,
    `invert(${f.invert}%)`,
    `hue-rotate(${f.hueRotate}deg)`,
    `opacity(${f.opacity}%)`,
  ].join(" ")
}

/** Фильтр для темы: dark → filter_dark или fallback на light. */
export function resolveThemeFilters(
  theme: "light" | "dark",
  light: IconCssFilters | null | undefined,
  dark: IconCssFilters | null | undefined,
): IconCssFilters {
  if (theme === "dark") {
    return dark ?? light ?? DEFAULT_ICON_FILTERS
  }
  return light ?? DEFAULT_ICON_FILTERS
}
