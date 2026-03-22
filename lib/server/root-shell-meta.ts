import { getSiteBaseUrl } from "@/lib/site-url"

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
