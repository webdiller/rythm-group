import { randomUUID } from "node:crypto"
import { deleteObjectByKey, putPublicObject } from "@/lib/s3/objects"
import { getPublicObjectUrl } from "@/lib/s3/public-url"
import { isSiteAssetS3Key } from "@/lib/s3/site-asset-url"

export { getSiteFaviconSrc, getSiteLogoSrc, isSiteAssetS3Key, isSiteFaviconS3Key, isSiteLogoS3Key } from "@/lib/s3/site-asset-url"

export function isLegacyBase64SiteAsset(value: string | null | undefined): boolean {
	if (!value) return false
	const v = value.trim()
	if (isSiteAssetS3Key(v)) return false
	if (v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:")) return false
	return v.length > 200
}

export function buildSiteLogoKey(): string {
	return `site/logo-${randomUUID()}.webp`
}

export function buildSiteFaviconKey(): string {
	return `site/favicon-${randomUUID()}.png`
}

export async function uploadSiteLogoWebp(webpBuffer: Buffer): Promise<string> {
	const key = buildSiteLogoKey()
	await putPublicObject({
		key,
		body: webpBuffer,
		contentType: "image/webp",
	})
	return key
}

export async function uploadSiteFaviconPng(pngBuffer: Buffer): Promise<string> {
	const key = buildSiteFaviconKey()
	await putPublicObject({
		key,
		body: pngBuffer,
		contentType: "image/png",
	})
	return key
}

export async function deleteSiteAssetIfStored(value: string | null | undefined): Promise<void> {
	if (!isSiteAssetS3Key(value)) return
	await deleteObjectByKey(value!.trim())
}

export function resolveSiteAssetPublicUrl(value: string | null | undefined): string | null {
	if (!isSiteAssetS3Key(value)) return null
	return getPublicObjectUrl(value!.trim())
}
