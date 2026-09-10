import { getNextPublicYaPublicBase, getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"

const CONTACT_ICON_PREFIX = "contact-icons/"

/** Ключ в бакете. Безопасно для client components. */
export function isContactIconS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(CONTACT_ICON_PREFIX) && v.length < 1024
}

/**
 * URL для `<img src>` из S3-ключа.
 * Без ключа / без `NEXT_PUBLIC_YA_PUBLIC_BASE` → null.
 */
export function getContactIconSrc(
  s3Key: string | null | undefined,
  options?: { cacheBust?: string | number },
): string | null {
  const raw = s3Key?.trim()
  if (!raw || !isContactIconS3Key(raw)) return null

  const base = getNextPublicYaPublicBase()
  if (!base) return null

  let src = getPublicObjectUrlFromBase(base, raw)
  if (options?.cacheBust != null && options.cacheBust !== "") {
    const sep = src.includes("?") ? "&" : "?"
    return `${src}${sep}ts=${options.cacheBust}`
  }
  return src
}
