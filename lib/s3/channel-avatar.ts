import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { isChannelAvatarS3Key } from "@/lib/s3/channel-avatar-url"

export { isChannelAvatarS3Key, getChannelAvatarSrc } from "@/lib/s3/channel-avatar-url"

/** Старые записи: сырой base64 WebP в колонке avatar. */
export function isLegacyBase64ChannelAvatar(value: string | null | undefined): boolean {
  if (!value) return false
  const v = value.trim()
  if (isChannelAvatarS3Key(v)) return false
  if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return false
  return v.length > 200
}

export function buildChannelAvatarKey(channelId: number): string {
  return `channels/${channelId}/avatar-${randomUUID()}.webp`
}

export async function uploadChannelAvatarWebp(channelId: number, webpBuffer: Buffer): Promise<string> {
  const key = buildChannelAvatarKey(channelId)
  await putPublicObject({
    key,
    body: webpBuffer,
    contentType: "image/webp",
  })
  return key
}

export async function deleteChannelAvatarIfStored(avatar: string | null | undefined): Promise<void> {
  if (!isChannelAvatarS3Key(avatar)) return
  await deleteObjectByKey(avatar!.trim())
}

export function resolveChannelAvatarPublicUrl(avatar: string | null | undefined): string | null {
  if (!isChannelAvatarS3Key(avatar)) return null
  return getPublicObjectUrl(avatar!.trim())
}
