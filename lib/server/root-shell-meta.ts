import { createHash } from "node:crypto"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { hasGlobalBackgroundThemes } from "@/lib/server/global-backgrounds"
import { resolveBackgroundSrc } from "@/lib/server/site-backgrounds"
import { getSiteFaviconSrc, isSiteFaviconS3Key } from "@/lib/s3/site-asset-url"

/** Флаги и URL фонов для единственного `SiteShell` в корневом layout. */
export async function getRootShellBackgroundFlags(): Promise<{
  hasAnyCustomBackgrounds: boolean
  prefetchBackgroundSrcs: string[]
}> {
  const bg = await hasGlobalBackgroundThemes()
  return {
    hasAnyCustomBackgrounds: bg.any,
    prefetchBackgroundSrcs: [
      resolveBackgroundSrc("global", "light"),
      resolveBackgroundSrc("global", "dark"),
      resolveBackgroundSrc("hero", "light"),
      resolveBackgroundSrc("hero", "dark"),
    ],
  }
}

/** Версия favicon для cache-busting в `<link rel="icon">`. */
export function getFaviconVersion(): string {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const source = existing?.favicon ?? "default"

  return createHash("sha1").update(source).digest("hex").slice(0, 12)
}

/** Href для `<link rel="icon">`: публичный S3 URL или статический дефолт. */
export function getSiteFaviconHref(): string {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const favicon = existing?.favicon ?? null
  const version = getFaviconVersion()
  if (isSiteFaviconS3Key(favicon)) {
    return getSiteFaviconSrc(favicon, { cacheBust: version })
  }
  return getSiteFaviconSrc(null, { cacheBust: version })
}
