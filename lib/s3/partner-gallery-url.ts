/**
 * Client-safe: галерея детальной страницы кейса (партнёра).
 */
import { getNextPublicYaPublicBase, getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"

export const PARTNER_GALLERY_KEY_PREFIX = "partners/"

export type PartnerCaseGalleryImage = {
	id: string
	originalKey: string
	thumbnailKey: string
	width: number
	height: number
	thumbnailWidth: number
	thumbnailHeight: number
}

export function isPartnerGalleryOriginalKey(value: string | null | undefined): boolean {
	if (!value) return false
	const v = value.trim()
	return v.startsWith(PARTNER_GALLERY_KEY_PREFIX) && v.includes("/gallery/") && !v.includes("-thumbnail.") && v.length < 1024
}

export function isPartnerGalleryThumbnailKey(value: string | null | undefined): boolean {
	if (!value) return false
	const v = value.trim()
	return v.startsWith(PARTNER_GALLERY_KEY_PREFIX) && v.includes("/gallery/") && v.includes("-thumbnail.") && v.length < 1024
}

export function parsePartnerCaseGalleryJson(raw: string | null | undefined): PartnerCaseGalleryImage[] {
	if (!raw?.trim()) return []
	try {
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		const out: PartnerCaseGalleryImage[] = []
		for (const item of parsed) {
			if (!item || typeof item !== "object") continue
			const row = item as Record<string, unknown>
			const id = typeof row.id === "string" ? row.id.trim() : ""
			const originalKey = typeof row.originalKey === "string" ? row.originalKey.trim() : ""
			const thumbnailKey = typeof row.thumbnailKey === "string" ? row.thumbnailKey.trim() : ""
			const width = typeof row.width === "number" ? row.width : Number(row.width)
			const height = typeof row.height === "number" ? row.height : Number(row.height)
			const thumbnailWidth = typeof row.thumbnailWidth === "number" ? row.thumbnailWidth : Number(row.thumbnailWidth)
			const thumbnailHeight = typeof row.thumbnailHeight === "number" ? row.thumbnailHeight : Number(row.thumbnailHeight)
			if (!id || !isPartnerGalleryOriginalKey(originalKey) || !isPartnerGalleryThumbnailKey(thumbnailKey)) {
				continue
			}
			if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(thumbnailWidth) || !Number.isFinite(thumbnailHeight)) {
				continue
			}
			out.push({
				id,
				originalKey,
				thumbnailKey,
				width: Math.round(width),
				height: Math.round(height),
				thumbnailWidth: Math.round(thumbnailWidth),
				thumbnailHeight: Math.round(thumbnailHeight),
			})
		}
		return out
	} catch {
		return []
	}
}

export function serializePartnerCaseGallery(images: PartnerCaseGalleryImage[]): string {
	return JSON.stringify(images)
}

export function getPartnerGalleryOriginalSrc(originalKey: string | null | undefined): string | null {
	if (!isPartnerGalleryOriginalKey(originalKey)) return null
	const base = getNextPublicYaPublicBase()
	if (!base) return null
	return getPublicObjectUrlFromBase(base, originalKey!.trim())
}

export function getPartnerGalleryThumbnailSrc(thumbnailKey: string | null | undefined): string | null {
	if (!isPartnerGalleryThumbnailKey(thumbnailKey)) return null
	const base = getNextPublicYaPublicBase()
	if (!base) return null
	return getPublicObjectUrlFromBase(base, thumbnailKey!.trim())
}
