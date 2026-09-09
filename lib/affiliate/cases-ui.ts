import { getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"
import { getPartnerGalleryOriginalSrc, getPartnerGalleryThumbnailSrc, parsePartnerCaseGalleryJson, type PartnerCaseGalleryImage } from "@/lib/s3/partner-gallery-url"
import { getChannelAvatarSrc } from "@/lib/s3/channel-avatar-url"
import { parseRelatedChannelIds } from "@/lib/partners/related-channel-ids"

export type LandingPartnerCategory = {
	id: number
	name: string
	name_ru: string
	name_en: string
	order_index: number
}

export type LandingPartner = {
	id: number
	category_id: number | null
	name: string
	logo_url: string | null
	title_ru?: string | null
	title_en?: string | null
	short_description_ru?: string | null
	short_description_en?: string | null
	published_at?: string | null
	wishlists?: number | null
	views?: number | null
	target_url?: string | null
	developer_url?: string | null
	steam_game_url?: string | null
	show_in_affiliate_cases?: boolean | null
	show_in_affiliate_steam?: boolean | null
	show_wishlists?: boolean | null
	show_views?: boolean | null
	case_gallery?: string | null
	show_logo_on_case_detail?: boolean | null
	related_channel_ids?: string | null
	order_index: number
}

export type LandingChannel = {
	id: number
	name: string
	url: string
	avatar?: string | null
	order_index?: number | null
}

export type AffiliateCaseCardUi = {
	id: number
	slug: string
	title: string
	coverImage: string
	publishedAt: string
	wishlists: number
}

export type AffiliateCaseGalleryImageUi = {
	id: string
	originalSrc: string
	thumbnailSrc: string
	width: number
	height: number
	thumbnailWidth: number
	thumbnailHeight: number
}

export type AffiliateCaseChannelUi = {
	id: number
	name: string
	url: string
	avatarSrc: string | null
}

export type AffiliateCaseDetailUi = {
	id: number
	slug: string
	title: string
	title_ru: string
	title_en: string
	coverImage: string
	showLogoOnCaseDetail: boolean
	gallery: AffiliateCaseGalleryImageUi[]
	channels: AffiliateCaseChannelUi[]
	category_ru: string
	category_en: string
	shortDescription_ru: string
	shortDescription_en: string
	wishlists: number
	views: number
	publishedAt: string
	steamGameUrl: string | null
	showWishlists: boolean
	showViews: boolean
}

export function buildAffiliateCaseSlug(partner: Pick<LandingPartner, "id" | "name">): string {
	return `${partner.id}-${slugify(partner.name)}`
}

export function parseAffiliateCaseIdFromSlug(slug: string): number | null {
	const idPart = slug.split("-")[0]
	const parsed = Number.parseInt(idPart ?? "", 10)
	return Number.isFinite(parsed) ? parsed : null
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

function generatedPublishedAt(id: number): string {
	const month = (id % 12) + 1
	const day = (id % 25) + 1
	return `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function generatedWishlists(id: number): number {
	return 2500 + ((id * 431) % 18000)
}

function generatedViews(id: number): number {
	return 1200 + ((id * 173) % 95000)
}

function mapGalleryForUi(raw: string | null | undefined): AffiliateCaseGalleryImageUi[] {
	const images = parsePartnerCaseGalleryJson(raw)
	const out: AffiliateCaseGalleryImageUi[] = []
	for (const image of images) {
		const originalSrc = getPartnerGalleryOriginalSrc(image.originalKey)
		const thumbnailSrc = getPartnerGalleryThumbnailSrc(image.thumbnailKey)
		if (!originalSrc || !thumbnailSrc) continue
		out.push({
			id: image.id,
			originalSrc,
			thumbnailSrc,
			width: image.width,
			height: image.height,
			thumbnailWidth: image.thumbnailWidth,
			thumbnailHeight: image.thumbnailHeight,
		})
	}
	return out
}

function mapChannelsForUi(rawIds: string | null | undefined, channels: LandingChannel[]): AffiliateCaseChannelUi[] {
	const ids = parseRelatedChannelIds(rawIds)
	if (ids.length === 0 || channels.length === 0) return []
	const byId = new Map(channels.map((channel) => [channel.id, channel]))
	const out: AffiliateCaseChannelUi[] = []
	for (const id of ids) {
		const channel = byId.get(id)
		if (!channel?.url?.trim()) continue
		out.push({
			id: channel.id,
			name: channel.name,
			url: channel.url.trim(),
			avatarSrc: getChannelAvatarSrc({
				id: channel.id,
				avatar: channel.avatar,
				hasAvatar: Boolean(channel.avatar),
			}),
		})
	}
	return out
}

export function mapPartnerToAffiliateCaseCard(partner: LandingPartner): AffiliateCaseCardUi {
	return {
		id: partner.id,
		slug: buildAffiliateCaseSlug(partner),
		title: partner.title_ru ?? partner.name,
		coverImage: getPartnerLogoSrc(partner) ?? "",
		publishedAt: partner.published_at ?? generatedPublishedAt(partner.id),
		wishlists: partner.wishlists ?? generatedWishlists(partner.id),
	}
}

export function mapPartnerToAffiliateCaseDetail(partner: LandingPartner, categories: LandingPartnerCategory[], channels: LandingChannel[] = []): AffiliateCaseDetailUi {
	const category = categories.find((item) => item.id === partner.category_id) ?? null

	return {
		id: partner.id,
		slug: buildAffiliateCaseSlug(partner),
		title: partner.title_ru ?? partner.name,
		title_ru: partner.title_ru ?? partner.name,
		title_en: partner.title_en ?? partner.name,
		coverImage: getPartnerLogoSrc(partner) ?? "",
		showLogoOnCaseDetail: partner.show_logo_on_case_detail ?? true,
		gallery: mapGalleryForUi(partner.case_gallery),
		channels: mapChannelsForUi(partner.related_channel_ids, channels),
		category_ru: category?.name_ru ?? "Без категории",
		category_en: category?.name_en ?? "Uncategorized",
		shortDescription_ru: partner.short_description_ru ?? "",
		shortDescription_en: partner.short_description_en ?? "",
		wishlists: partner.wishlists ?? generatedWishlists(partner.id),
		views: partner.views ?? generatedViews(partner.id),
		publishedAt: partner.published_at ?? generatedPublishedAt(partner.id),
		steamGameUrl: partner.steam_game_url?.trim() || null,
		showWishlists: partner.show_wishlists ?? true,
		showViews: partner.show_views ?? true,
	}
}

export type { PartnerCaseGalleryImage }
