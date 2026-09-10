import type { IconCssFilters } from "@/lib/contact-icons/filters"

export type DirectContactLinkType = "telegram" | "email" | "instagram" | "max" | "other"

export type DirectContactLink = {
  id: string
  url: string
  type: DirectContactLinkType
  /** ID из библиотеки contact_icons; без фолбеков на /icon-*.svg или data: */
  icon_id: number | null
  /** Переопределение фильтров для светлой темы (null/omit = из библиотеки) */
  filter_light?: IconCssFilters | null
  /** Переопределение для тёмной темы */
  filter_dark?: IconCssFilters | null
  label_ru: string
  label_en: string
  description_ru?: string
  description_en?: string
}

export function parseDirectContactLinks(raw: string | null | undefined): DirectContactLink[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item): DirectContactLink | null => {
        if (!item || typeof item !== "object") return null
        const row = item as Record<string, unknown>
        const url = typeof row.url === "string" ? row.url : ""
        const labelRu =
          typeof row.label_ru === "string" ? row.label_ru : typeof row.label === "string" ? row.label : ""
        const labelEn = typeof row.label_en === "string" ? row.label_en : ""
        if (!url || (!labelRu && !labelEn && typeof row.label !== "string")) return null
        const id =
          typeof row.id === "string" && row.id.length > 0
            ? row.id
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const descriptionRu =
          typeof row.description_ru === "string"
            ? row.description_ru
            : typeof row.description === "string"
              ? row.description
              : ""
        const descriptionEn = typeof row.description_en === "string" ? row.description_en : ""
        const typeValue = typeof row.type === "string" ? row.type : "other"
        const type: DirectContactLinkType =
          typeValue === "telegram" ||
          typeValue === "email" ||
          typeValue === "instagram" ||
          typeValue === "max"
            ? typeValue
            : "other"

        let icon_id: number | null = null
        if (typeof row.icon_id === "number" && Number.isFinite(row.icon_id)) {
          icon_id = row.icon_id
        } else if (typeof row.icon_id === "string" && row.icon_id.trim() !== "") {
          const n = Number(row.icon_id)
          if (Number.isFinite(n)) icon_id = n
        }

        const filter_light = parseFiltersField(row.filter_light)
        const filter_dark = parseFiltersField(row.filter_dark)

        return {
          id,
          url,
          type,
          icon_id,
          filter_light,
          filter_dark,
          label_ru: labelRu,
          label_en: labelEn,
          description_ru: descriptionRu || undefined,
          description_en: descriptionEn || undefined,
        }
      })
      .filter((v): v is DirectContactLink => v !== null)
  } catch {
    return []
  }
}

function parseFiltersField(value: unknown): IconCssFilters | null | undefined {
  if (value == null) return null
  if (typeof value !== "object") return undefined
  const v = value as Record<string, unknown>
  const num = (k: string, fallback: number) =>
    typeof v[k] === "number" && Number.isFinite(v[k] as number) ? (v[k] as number) : fallback
  return {
    brightness: num("brightness", 100),
    contrast: num("contrast", 100),
    saturate: num("saturate", 100),
    invert: num("invert", 0),
    hueRotate: num("hueRotate", 0),
    opacity: num("opacity", 100),
  }
}

export function serializeDirectContactLinks(links: DirectContactLink[]): string | null {
  if (links.length === 0) return null
  return JSON.stringify(
    links.map((link) => ({
      id: link.id,
      url: link.url,
      type: link.type,
      icon_id: link.icon_id,
      filter_light: link.filter_light ?? null,
      filter_dark: link.filter_dark ?? null,
      label_ru: link.label_ru,
      label_en: link.label_en,
      description_ru: link.description_ru,
      description_en: link.description_en,
    })),
  )
}
