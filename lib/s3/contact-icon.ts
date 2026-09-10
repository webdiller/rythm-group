import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { isContactIconS3Key } from "@/lib/s3/contact-icon-url"

export { isContactIconS3Key, getContactIconSrc } from "@/lib/s3/contact-icon-url"

export function buildContactIconKey(ext: "png" | "svg"): string {
  return `contact-icons/icon-${randomUUID()}.${ext}`
}

export async function uploadContactIconFile(
  body: Buffer,
  contentType: "image/png" | "image/svg+xml",
): Promise<string> {
  const ext = contentType === "image/svg+xml" ? "svg" : "png"
  const key = buildContactIconKey(ext)
  await putPublicObject({
    key,
    body,
    contentType,
  })
  return key
}

export async function deleteContactIconIfStored(s3Key: string | null | undefined): Promise<void> {
  if (!isContactIconS3Key(s3Key)) return
  await deleteObjectByKey(s3Key!.trim())
}

export function resolveContactIconPublicUrl(s3Key: string | null | undefined): string | null {
  if (!isContactIconS3Key(s3Key)) return null
  return getPublicObjectUrl(s3Key!.trim())
}
