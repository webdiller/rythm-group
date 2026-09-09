import { text } from "drizzle-orm/sqlite-core"

/**
 * SQLite: use text for datetime (ISO string).
 * Defaults to CURRENT_TIMESTAMP equivalent via $defaultFn.
 */
export function created_at(name = "created_at") {
  return text(name, { mode: "text" }).$defaultFn(() => new Date().toISOString())
}

export function updated_at(name = "updated_at") {
  return text(name, { mode: "text" }).$defaultFn(() => new Date().toISOString())
}
