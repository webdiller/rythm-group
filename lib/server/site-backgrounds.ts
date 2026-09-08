import path from "node:path"
import { promises as fs } from "node:fs"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import {
  BACKGROUND_SLOTS,
  type BackgroundKind,
  type BackgroundSlot,
  type BackgroundsMap,
  backgroundSlotToFilename,
  getBackgroundSrc,
  parseBackgroundsJson,
  resolveBackgroundSlot,
  serializeBackgroundsMap,
  isBackgroundS3Key,
} from "@/lib/s3/background-slots"
import { deleteBackgroundIfStored } from "@/lib/s3/backgrounds"

const BG_DIR = path.join(process.cwd(), "public", "backgrounds")

export function getBackgroundsMap(): BackgroundsMap {
  const db = getDb()
  const row = db.select({ backgrounds: tableSiteSettings.backgrounds }).from(tableSiteSettings).limit(1).get()
  return parseBackgroundsJson(row?.backgrounds)
}

export function getBackgroundKey(
  kind: BackgroundKind,
  theme?: string | null,
  scope?: string | null,
): string | null {
  const slot = resolveBackgroundSlot(kind, theme, scope)
  return getBackgroundsMap()[slot] ?? null
}

export function setBackgroundKey(slot: BackgroundSlot, key: string | null): void {
  const db = getDb()
  const existing = db.select().from(tableSiteSettings).limit(1).all()[0]
  const map = parseBackgroundsJson(existing?.backgrounds)
  if (key) map[slot] = key
  else delete map[slot]
  const json = serializeBackgroundsMap(map)

  if (existing) {
    db.update(tableSiteSettings)
      .set({ backgrounds: json })
      .where(eq(tableSiteSettings.id, existing.id))
      .run()
    return
  }
  db.insert(tableSiteSettings).values({ backgrounds: json }).run()
}

export async function replaceBackgroundKey(
  slot: BackgroundSlot,
  nextKey: string,
): Promise<void> {
  const prev = getBackgroundsMap()[slot] ?? null
  setBackgroundKey(slot, nextKey)
  if (prev && prev !== nextKey) await deleteBackgroundIfStored(prev)
}

export async function clearBackgroundKey(slot: BackgroundSlot): Promise<void> {
  const prev = getBackgroundsMap()[slot] ?? null
  setBackgroundKey(slot, null)
  await deleteBackgroundIfStored(prev)
}

export function legacyBackgroundDiskPath(slot: BackgroundSlot): string {
  return path.join(BG_DIR, backgroundSlotToFilename(slot))
}

export async function legacyBackgroundFileExists(slot: BackgroundSlot): Promise<boolean> {
  try {
    await fs.access(legacyBackgroundDiskPath(slot))
    return true
  } catch {
    return false
  }
}

/** Есть ли фон: S3-ключ в settings или legacy-файл на диске. */
export async function hasBackgroundSlot(slot: BackgroundSlot): Promise<boolean> {
  if (getBackgroundsMap()[slot]) return true
  return legacyBackgroundFileExists(slot)
}

/** Public URL или static `/backgrounds/...` для слота (SSR). */
export function resolveBackgroundSrc(
  kind: BackgroundKind,
  theme?: string | null,
  scope?: string | null,
): string {
  const slot = resolveBackgroundSlot(kind, theme, scope)
  const key = getBackgroundsMap()[slot] ?? null
  if (key && isBackgroundS3Key(key)) {
    return getPublicObjectUrl(key)
  }
  return getBackgroundSrc(kind, { theme, scope, key: null })
}

/** Наличие каждого слота (S3 key или legacy-файл на диске) — для админки. */
export async function getBackgroundPresenceMap(): Promise<Record<BackgroundSlot, boolean>> {
  const entries = await Promise.all(
    BACKGROUND_SLOTS.map(async (slot) => [slot, await hasBackgroundSlot(slot)] as const),
  )
  return Object.fromEntries(entries) as Record<BackgroundSlot, boolean>
}

export async function hasGlobalBackgroundThemes(scope?: "affiliate" | null): Promise<{
  light: boolean
  dark: boolean
  both: boolean
  any: boolean
}> {
  const lightSlot = resolveBackgroundSlot("global", "light", scope)
  const darkSlot = resolveBackgroundSlot("global", "dark", scope)
  const [light, dark] = await Promise.all([
    hasBackgroundSlot(lightSlot),
    hasBackgroundSlot(darkSlot),
  ])
  return { light, dark, both: light && dark, any: light || dark }
}
