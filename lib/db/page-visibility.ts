import "server-only"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"

export function getPageVisibilityFlags(): {
	pageBlogEnabled: boolean
	pageAffiliateEnabled: boolean
} {
	const db = getDb()
	const row = db.select().from(tableSiteSettings).limit(1).all()[0]

	if (!row) {
		return { pageBlogEnabled: true, pageAffiliateEnabled: true }
	}

	return {
		pageBlogEnabled: row.page_blog_enabled ?? true,
		pageAffiliateEnabled: row.page_affiliate_enabled ?? true,
	}
}
