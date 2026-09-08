import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import {
  isPartnerLogoS3Key,
} from "@/lib/s3/partner-logo-url"

export { isPartnerLogoS3Key, getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"

/** Старые записи: сырой base64 WebP в колонке logo_url. */
export function isLegacyBase64Logo(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isPartnerLogoS3Key(v)) return false
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return false
  return v.length > 200
}

export function buildPartnerLogoKey(partnerId: number): string {
  return `partners/${partnerId}/logo-${randomUUID()}.webp`
}

export async function uploadPartnerLogoWebp(
  partnerId: number,
  webpBuffer: Buffer,
): Promise<string> {
  const key = buildPartnerLogoKey(partnerId)
  await putPublicObject({
    key,
    body: webpBuffer,
    contentType: "image/webp",
  })
  return key
}

export async function deletePartnerLogoIfStored(logoUrl: string | null | undefined): Promise<void> {
  if (!isPartnerLogoS3Key(logoUrl)) return
  await deleteObjectByKey(logoUrl!.trim())
}

export function resolvePartnerLogoPublicUrl(logoUrl: string | null | undefined): string | null {
  if (!isPartnerLogoS3Key(logoUrl)) return null
  return getPublicObjectUrl(logoUrl!.trim())
}
