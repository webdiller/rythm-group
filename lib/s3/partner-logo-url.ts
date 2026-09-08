import {
  getNextPublicYaPublicBase,
  getPublicObjectUrlFromBase,
} from "@/lib/s3/public-url.shared"

const PARTNER_LOGO_PREFIX = "partners/"

/** Ключ в бакете (не base64 и не полный URL). Безопасно для client components. */
export function isPartnerLogoS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(PARTNER_LOGO_PREFIX) && v.length < 1024
}

/**
 * URL для `<img src>` из S3-ключа. Без ключа / без `NEXT_PUBLIC_YA_PUBLIC_BASE` → null.
 */
export function getPartnerLogoSrc(
  partner: { id: number; logo_url: string | null | undefined },
  options?: { cacheBust?: string | number },
): string | null {
  const raw = partner.logo_url?.trim()
  if (!raw || !isPartnerLogoS3Key(raw)) return null

  const base = getNextPublicYaPublicBase()
  if (!base) return null

  let src = getPublicObjectUrlFromBase(base, raw)
  if (options?.cacheBust != null && options.cacheBust !== "") {
    const sep = src.includes("?") ? "&" : "?"
    return `${src}${sep}ts=${options.cacheBust}`
  }
  return src
}
