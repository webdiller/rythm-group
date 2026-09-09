import { isSiteFaviconS3Key, isSiteLogoS3Key } from "@/lib/s3/site-asset-url"
import { parseBackgroundsJson, serializeBackgroundsMap } from "@/lib/s3/background-slots"

/** В JSON API не отдаём base64 — только S3-ключи или null. */
export function sanitizeSiteSettingsBranding<
  T extends {
    logo?: string | null
    favicon?: string | null
    backgrounds?: string | null
  },
>(row: T): T {
  const backgroundsRaw = row.backgrounds
  const backgrounds = backgroundsRaw == null || backgroundsRaw === "" ? null : serializeBackgroundsMap(parseBackgroundsJson(backgroundsRaw))

  return {
    ...row,
    logo: isSiteLogoS3Key(row.logo) ? row.logo!.trim() : null,
    favicon: isSiteFaviconS3Key(row.favicon) ? row.favicon!.trim() : null,
    backgrounds,
  }
}
