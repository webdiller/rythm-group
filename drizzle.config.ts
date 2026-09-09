import { defineConfig } from "drizzle-kit"
import path from "path"

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "cms.db")

export default defineConfig({
	schema: "./lib/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: DB_PATH,
	},
})
