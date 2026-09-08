import {
  getNextPublicYaPublicBase,
  getPublicObjectUrlFromBase,
} from "@/lib/s3/public-url.shared"

const SITE_LOGO_PREFIX = "site/logo-"
const SITE_FAVICON_PREFIX = "site/favicon-"

/** Статический дефолт из `public/logo.jpg`. */
export const DEFAULT_SITE_LOGO_SRC = "/logo.jpg"
/** Статический дефолт (если файла нет — браузер покажет broken icon). */
export const DEFAULT_SITE_FAVICON_SRC = "/logo.jpg"

export function isSiteLogoS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(SITE_LOGO_PREFIX) && v.length < 1024
}

export function isSiteFaviconS3Key(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  return v.startsWith(SITE_FAVICON_PREFIX) && v.length < 1024
}

/** Любой site asset key (`site/logo-…` или `site/favicon-…`). */
export function isSiteAssetS3Key(value: string | null | undefined): boolean {
  return isSiteLogoS3Key(value) || isSiteFaviconS3Key(value)
}

function withCacheBust(src: string, cacheBust?: string | number): string {
  if (cacheBust == null || cacheBust === "") return src
  const sep = src.includes("?") ? "&" : "?"
  return `${src}${sep}ts=${cacheBust}`
}

/**
 * URL логотипа сайта. S3-ключ → public URL; иначе статический `/logo.jpg`.
 */
export function getSiteLogoSrc(
  logo?: string | null,
  options?: { cacheBust?: string | number },
): string {
  if (isSiteLogoS3Key(logo)) {
    const base = getNextPublicYaPublicBase()
    if (base) {
      return withCacheBust(getPublicObjectUrlFromBase(base, logo!.trim()), options?.cacheBust)
    }
  }
  return withCacheBust(DEFAULT_SITE_LOGO_SRC, options?.cacheBust)
}

/**
 * URL favicon. S3-ключ → public URL; иначе `/favicon.ico`.
 */
export function getSiteFaviconSrc(
  favicon?: string | null,
  options?: { cacheBust?: string | number },
): string {
  if (isSiteFaviconS3Key(favicon)) {
    const base = getNextPublicYaPublicBase()
    if (base) {
      return withCacheBust(getPublicObjectUrlFromBase(base, favicon!.trim()), options?.cacheBust)
    }
  }
  return withCacheBust(DEFAULT_SITE_FAVICON_SRC, options?.cacheBust)
}
