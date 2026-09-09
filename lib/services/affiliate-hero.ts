import { getDb } from "@/lib/db"
import { tableAffiliateHero } from "@/lib/db/schema"
import type { UpsertBody } from "@/lib/schemas/affiliate-hero"
import { eq } from "drizzle-orm"

export class ServiceAffiliateHero {
	static getOne() {
		const db = getDb()
		const row = db.select().from(tableAffiliateHero).limit(1).all()[0]
		return { data: row ?? null, meta: null }
	}

	static upsert(body: UpsertBody) {
		const db = getDb()
		const existing = db.select().from(tableAffiliateHero).limit(1).all()[0]
		if (existing) {
			const [updated] = db.update(tableAffiliateHero).set(body).where(eq(tableAffiliateHero.id, existing.id)).returning().all()
			if (!updated) throw new Error("Failed to update affiliate hero")
			return { data: updated, meta: null }
		}
		const [created] = db.insert(tableAffiliateHero).values(body).returning().all()
		if (!created) throw new Error("Failed to create affiliate hero")
		return { data: created, meta: null }
	}
}
