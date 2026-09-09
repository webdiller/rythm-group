import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import path from "path"
import fs from "fs"
import * as schema from "./schema"
import { runMigrations } from "./migrations"

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "cms.db")

const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true })
}

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
	if (db) {
		return db
	}
	const sqlite = new Database(DB_PATH)
	sqlite.pragma("foreign_keys = ON")
	runMigrations(sqlite)
	db = drizzle(sqlite, { schema })
	return db
}

export { runSeed } from "./seed"
export * from "./schema"
export * from "./common-fields"
