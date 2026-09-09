import { getNextPublicYaPublicBase, getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"

const CHANNEL_AVATAR_PREFIX = "channels/"

/** Ключ в бакете. Безопасно для client components. */
export function isChannelAvatarS3Key(value: string | null | undefined): boolean {
	if (!value) return false
	const v = value.trim()
	return v.startsWith(CHANNEL_AVATAR_PREFIX) && v.length < 1024
}

/**
 * URL для `<img src>` аватара канала из S3-ключа.
 * Без ключа / без `NEXT_PUBLIC_YA_PUBLIC_BASE` → null.
 */
export function getChannelAvatarSrc(
	channel: {
		id: number
		avatar?: string | null
		hasAvatar?: boolean
	},
	options?: { cacheBust?: string | number },
): string | null {
	const raw = channel.avatar?.trim()
	if (!raw || !isChannelAvatarS3Key(raw)) return null

	const base = getNextPublicYaPublicBase()
	if (!base) return null

	let src = getPublicObjectUrlFromBase(base, raw)
	if (options?.cacheBust != null && options.cacheBust !== "") {
		const sep = src.includes("?") ? "&" : "?"
		return `${src}${sep}ts=${options.cacheBust}`
	}
	return src
}
