import { getDb } from "@/lib/db"
import { tableUsers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type UserRow = typeof tableUsers.$inferSelect

export class ServiceUsers {
	static getByUsername(username: string): UserRow | undefined {
		const db = getDb()
		return db.select().from(tableUsers).where(eq(tableUsers.username, username)).get()
	}
}
