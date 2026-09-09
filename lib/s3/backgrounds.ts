import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { type BackgroundSlot, isBackgroundS3Key } from "@/lib/s3/background-slots"

export { BACKGROUND_SLOTS, backgroundSlotToFilename, getBackgroundSrc, isBackgroundS3Key, parseBackgroundsJson, resolveBackgroundSlot, serializeBackgroundsMap, type BackgroundKind, type BackgroundSlot, type BackgroundsMap } from "@/lib/s3/background-slots"

export function buildBackgroundKey(slot: BackgroundSlot): string {
  return `site/backgrounds/${slot}-${randomUUID()}.webp`
}

export async function uploadBackgroundWebp(slot: BackgroundSlot, webpBuffer: Buffer): Promise<string> {
  const key = buildBackgroundKey(slot)
  await putPublicObject({
    key,
    body: webpBuffer,
    contentType: "image/webp",
    // Фоны могут заменяться; ключ с UUID → immutable ок
    cacheControl: "public, max-age=31536000, immutable",
  })
  return key
}

export async function deleteBackgroundIfStored(key: string | null | undefined): Promise<void> {
  if (!isBackgroundS3Key(key)) return
  await deleteObjectByKey(key!.trim())
}

export function resolveBackgroundPublicUrl(key: string | null | undefined): string | null {
  if (!isBackgroundS3Key(key)) return null
  return getPublicObjectUrl(key!.trim())
}
