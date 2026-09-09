/** Базовый URL сайта для серверных fetch к собственным API (как на главной). */
export function getSiteBaseUrl(): string {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
	if (siteUrl) {
		if (siteUrl.startsWith("http")) return siteUrl
		return `https://${siteUrl}`
	}
	return "http://localhost:3000"
}
