import type Database from "better-sqlite3"

export function runMigrations(sqlite: Database.Database): void {
  const columns = sqlite
    .prepare("PRAGMA table_info(site_settings)")
    .all() as Array<{ name: string }>
  const names = new Set(columns.map((c) => c.name))

  if (!names.has("page_blog_enabled")) {
    sqlite.exec(
      "ALTER TABLE site_settings ADD COLUMN page_blog_enabled INTEGER NOT NULL DEFAULT 1"
    )
  }
  if (!names.has("page_affiliate_enabled")) {
    sqlite.exec(
      "ALTER TABLE site_settings ADD COLUMN page_affiliate_enabled INTEGER NOT NULL DEFAULT 1"
    )
  }
}
