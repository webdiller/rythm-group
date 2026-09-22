import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { type BackgroundSlot, isBackgroundS3Key } from "@/lib/s3/background-slots"

export { BACKGROUND_SLOTS, backgroundSlotToFilename, getBackgroundSrc, isBackgroundS3Key, parseBackgroundsJson, resolveBackgroundSlot, serializeBackgroundsMap, type BackgroundKind, type BackgroundSlot, type BackgroundsMap } from "@/lib/s3/background-slots"

export function buildBackgroundKey(slot: BackgroundSlot, ext: "jpg" | "png" | "webp" = "webp"): string {
  return `site/backgrounds/${slot}-${randomUUID()}.${ext}`
}

function extensionForMime(contentType: string): "jpg" | "png" | "webp" {
  if (contentType === "image/png") return "png"
  if (contentType === "image/jpeg") return "jpg"
  return "webp"
}

/** Загрузка фона без перекодирования — байты файла как есть. */
export async function uploadBackgroundImage(slot: BackgroundSlot, buffer: Buffer, contentType: string): Promise<string> {
  const key = buildBackgroundKey(slot, extensionForMime(contentType))
  await putPublicObject({
    key,
    body: buffer,
    contentType,
    cacheControl: "public, max-age=31536000, immutable",
  })
  return key
}

/** @deprecated используйте uploadBackgroundImage */
export async function uploadBackgroundWebp(slot: BackgroundSlot, webpBuffer: Buffer): Promise<string> {
  return uploadBackgroundImage(slot, webpBuffer, "image/webp")
}

export async function deleteBackgroundIfStored(key: string | null | undefined): Promise<void> {
  if (!isBackgroundS3Key(key)) return
  await deleteObjectByKey(key!.trim())
}

export function resolveBackgroundPublicUrl(key: string | null | undefined): string | null {
  if (!isBackgroundS3Key(key)) return null
  return getPublicObjectUrl(key!.trim())
}
