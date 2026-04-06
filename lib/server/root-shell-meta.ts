import { getSiteBaseUrl } from "@/lib/site-url"
import { createHash } from "node:crypto"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"

/** Флаги фона для единственного `SiteShell` в корневом layout (без повторного спиннера при смене маршрута). */
export async function getRootShellBackgroundFlags(): Promise<{
  hasAnyCustomBackgrounds: boolean
}> {
  const baseUrl = getSiteBaseUrl()
  const [globalLightBgRes, globalDarkBgRes] = await Promise.all([
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=light`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/site/backgrounds/global?theme=dark`, { cache: "no-store" }),
  ])
  const hasAnyCustomBackgrounds = globalLightBgRes.ok || globalDarkBgRes.ok
  return { hasAnyCustomBackgrounds }
}

/** Версия favicon для cache-busting в `<link rel="icon">`. */
export function getFaviconVersion(): string {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const source = existing?.favicon ?? "default"

  return createHash("sha1").update(source).digest("hex").slice(0, 12)
}
