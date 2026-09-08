import {
  getNextPublicYaPublicBase,
  getPublicObjectUrlFromBase,
} from "@/lib/s3/public-url.shared"

const ABOUT_ICON_PREFIX = "about-cards/"

/** Ключ в бакете. Безопасно для client components. */
export function isAboutIconS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(ABOUT_ICON_PREFIX) && v.length < 1024
}

/**
 * URL для `<img src>` кастомной иконки about-card из S3-ключа.
 * Без ключа / без `NEXT_PUBLIC_YA_PUBLIC_BASE` → null.
 */
export function getAboutIconSrc(
  card: {
    id: number
    icon_image?: string | null
    has_custom_icon?: boolean
  },
  options?: { cacheBust?: string | number },
): string | null {
  const raw = card.icon_image?.trim()
  if (!raw || !isAboutIconS3Key(raw)) return null

  const base = getNextPublicYaPublicBase()
  if (!base) return null

  let src = getPublicObjectUrlFromBase(base, raw)
  if (options?.cacheBust != null && options.cacheBust !== "") {
    const sep = src.includes("?") ? "&" : "?"
    return `${src}${sep}ts=${options.cacheBust}`
  }
  return src
}
