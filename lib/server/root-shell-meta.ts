import { createHash } from "node:crypto"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { hasGlobalBackgroundThemes } from "@/lib/server/global-backgrounds"

/** Флаги фона для единственного `SiteShell` в корневом layout (без повторного спиннера при смене маршрута). */
export async function getRootShellBackgroundFlags(): Promise<{
  hasAnyCustomBackgrounds: boolean
}> {
  const bg = await hasGlobalBackgroundThemes()
  return { hasAnyCustomBackgrounds: bg.any }
}

/** Версия favicon для cache-busting в `<link rel="icon">`. */
export function getFaviconVersion(): string {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const source = existing?.favicon ?? "default"

  return createHash("sha1").update(source).digest("hex").slice(0, 12)
}
