import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import {
  type PartnerCaseGalleryImage,
  isPartnerGalleryOriginalKey,
  isPartnerGalleryThumbnailKey,
  parsePartnerCaseGalleryJson,
  serializePartnerCaseGallery,
} from "@/lib/s3/partner-gallery-url"

export {
  type PartnerCaseGalleryImage,
  getPartnerGalleryOriginalSrc,
  getPartnerGalleryThumbnailSrc,
  isPartnerGalleryOriginalKey,
  isPartnerGalleryThumbnailKey,
  parsePartnerCaseGalleryJson,
  serializePartnerCaseGallery,
} from "@/lib/s3/partner-gallery-url"

const ORIGINAL_MAX_LONG_SIDE = 2560
const THUMBNAIL_MAX_LONG_SIDE = 320
const THUMBNAIL_MAX_BYTES = 20 * 1024

export function buildPartnerGalleryOriginalKey(partnerId: number, imageId: string): string {
  return `partners/${partnerId}/gallery/${imageId}-original.webp`
}

export function buildPartnerGalleryThumbnailKey(partnerId: number, imageId: string): string {
  return `partners/${partnerId}/gallery/${imageId}-thumbnail.jpg`
}

async function encodeThumbnailUnderLimit(input: Buffer): Promise<{
  buffer: Buffer
  width: number
  height: number
}> {
  let longSide = THUMBNAIL_MAX_LONG_SIDE
  let quality = 72

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const pipeline = sharp(input).rotate().resize(longSide, longSide, {
      fit: "inside",
      withoutEnlargement: true,
    })
    const buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer()
    const meta = await sharp(buffer).metadata()
    const width = meta.width ?? longSide
    const height = meta.height ?? longSide
    if (buffer.length <= THUMBNAIL_MAX_BYTES) {
      return { buffer, width, height }
    }
    if (quality > 35) {
      quality -= 8
      continue
    }
    longSide = Math.max(120, Math.round(longSide * 0.85))
    quality = 60
  }

  const fallback = await sharp(input)
    .rotate()
    .resize(160, 160, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 40, mozjpeg: true })
    .toBuffer()
  const meta = await sharp(fallback).metadata()
  return {
    buffer: fallback,
    width: meta.width ?? 160,
    height: meta.height ?? 160,
  }
}

export async function uploadPartnerGalleryImage(
  partnerId: number,
  inputBuffer: Buffer,
): Promise<PartnerCaseGalleryImage> {
  const imageId = randomUUID()
  const originalPipeline = sharp(inputBuffer).rotate().resize(
    ORIGINAL_MAX_LONG_SIDE,
    ORIGINAL_MAX_LONG_SIDE,
    {
      fit: "inside",
      withoutEnlargement: true,
    },
  )
  const originalBuffer = await originalPipeline.webp({ quality: 90 }).toBuffer()
  const originalMeta = await sharp(originalBuffer).metadata()
  const width = originalMeta.width ?? ORIGINAL_MAX_LONG_SIDE
  const height = originalMeta.height ?? ORIGINAL_MAX_LONG_SIDE

  const thumbnail = await encodeThumbnailUnderLimit(inputBuffer)

  const originalKey = buildPartnerGalleryOriginalKey(partnerId, imageId)
  const thumbnailKey = buildPartnerGalleryThumbnailKey(partnerId, imageId)

  await putPublicObject({
    key: originalKey,
    body: originalBuffer,
    contentType: "image/webp",
  })
  try {
    await putPublicObject({
      key: thumbnailKey,
      body: thumbnail.buffer,
      contentType: "image/jpeg",
    })
  } catch (error) {
    await deleteObjectByKey(originalKey)
    throw error
  }

  return {
    id: imageId,
    originalKey,
    thumbnailKey,
    width,
    height,
    thumbnailWidth: thumbnail.width,
    thumbnailHeight: thumbnail.height,
  }
}

export async function deletePartnerGalleryImageObjects(
  image: Pick<PartnerCaseGalleryImage, "originalKey" | "thumbnailKey">,
): Promise<void> {
  if (isPartnerGalleryOriginalKey(image.originalKey)) {
    await deleteObjectByKey(image.originalKey)
  }
  if (isPartnerGalleryThumbnailKey(image.thumbnailKey)) {
    await deleteObjectByKey(image.thumbnailKey)
  }
}

export async function deletePartnerCaseGalleryAll(
  raw: string | null | undefined,
): Promise<void> {
  const images = parsePartnerCaseGalleryJson(raw)
  for (const image of images) {
    await deletePartnerGalleryImageObjects(image)
  }
}

export function resolvePartnerGalleryOriginalPublicUrl(originalKey: string): string {
  return getPublicObjectUrl(originalKey.trim())
}

export function resolvePartnerGalleryThumbnailPublicUrl(thumbnailKey: string): string {
  return getPublicObjectUrl(thumbnailKey.trim())
}
