import path from "node:path"
import { promises as fs } from "node:fs"

const GLOBAL_BG_DIR = path.join(process.cwd(), "public", "backgrounds")

function getGlobalPath(theme: "light" | "dark", scope?: "affiliate" | null) {
  const isAffiliate = scope === "affiliate"
  if (theme === "light") {
    return path.join(GLOBAL_BG_DIR, isAffiliate ? "global-affiliate-light.webp" : "global-light.webp")
  }
  return path.join(GLOBAL_BG_DIR, isAffiliate ? "global-affiliate-dark.webp" : "global-dark.webp")
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

export async function hasGlobalBackgroundThemes(scope?: "affiliate" | null): Promise<{
  light: boolean
  dark: boolean
  both: boolean
  any: boolean
}> {
  const [light, dark] = await Promise.all([
    fileExists(getGlobalPath("light", scope)),
    fileExists(getGlobalPath("dark", scope)),
  ])
  return { light, dark, both: light && dark, any: light || dark }
}
