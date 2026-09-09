import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { isAboutIconS3Key } from "@/lib/s3/about-icon-url"

export { isAboutIconS3Key, getAboutIconSrc } from "@/lib/s3/about-icon-url"

/** Старые записи: сырой base64 WebP в колонке icon_image. */
export function isLegacyBase64AboutIcon(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isAboutIconS3Key(v)) return false
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return false
  return v.length > 200
}

export function buildAboutIconKey(cardId: number): string {
  return `about-cards/${cardId}/icon-${randomUUID()}.webp`
}

export async function uploadAboutIconWebp(cardId: number, webpBuffer: Buffer): Promise<string> {
  const key = buildAboutIconKey(cardId)
  await putPublicObject({
    key,
    body: webpBuffer,
    contentType: "image/webp",
  })
  return key
}

export async function deleteAboutIconIfStored(iconImage: string | null | undefined): Promise<void> {
  if (!isAboutIconS3Key(iconImage)) return
  await deleteObjectByKey(iconImage!.trim())
}

export function resolveAboutIconPublicUrl(iconImage: string | null | undefined): string | null {
  if (!isAboutIconS3Key(iconImage)) return null
  return getPublicObjectUrl(iconImage!.trim())
}
