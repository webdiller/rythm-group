import fs from "fs"
import path from "path"
import type Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"

function tableExists(sqlite: Database.Database, name: string): boolean {
  const row = sqlite
    .prepare("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name) as { ok: number } | undefined
  return Boolean(row)
}

/** Пустая БД: применить SQL из ./drizzle (только если таблиц ещё нет). */
function applyDrizzleMigrationsIfEmpty(sqlite: Database.Database): void {
  if (tableExists(sqlite, "site_settings")) return

  const migrationsFolder = path.join(process.cwd(), "drizzle")
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      `SQLite has no tables and folder "${migrationsFolder}" is missing. Run: npm run db:push`,
    )
  }

  migrate(drizzle(sqlite), { migrationsFolder })
}

export function runMigrations(sqlite: Database.Database): void {
  applyDrizzleMigrationsIfEmpty(sqlite)

  if (tableExists(sqlite, "site_settings")) {
    const columns = sqlite.prepare("PRAGMA table_info(site_settings)").all() as Array<{
      name: string
    }>
    const names = new Set(columns.map((c) => c.name))

    if (!names.has("page_blog_enabled")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN page_blog_enabled INTEGER NOT NULL DEFAULT 1")
    }
    if (!names.has("page_affiliate_enabled")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN page_affiliate_enabled INTEGER NOT NULL DEFAULT 1")
    }
    if (!names.has("site_published")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN site_published INTEGER NOT NULL DEFAULT 1")
    }
    if (!names.has("channels_show_subscribers")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN channels_show_subscribers INTEGER NOT NULL DEFAULT 1")
    }
    if (!names.has("channels_show_reach")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN channels_show_reach INTEGER NOT NULL DEFAULT 1")
    }
    if (!names.has("channels_card_align")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN channels_card_align TEXT NOT NULL DEFAULT 'left'")
    }
    if (!names.has("backgrounds")) {
      sqlite.exec("ALTER TABLE site_settings ADD COLUMN backgrounds TEXT")
    }
  }

  if (tableExists(sqlite, "partners")) {
    const partnerColumns = sqlite.prepare("PRAGMA table_info(partners)").all() as Array<{
      name: string
    }>
    const partnerNames = new Set(partnerColumns.map((c) => c.name))
    if (!partnerNames.has("steam_game_url")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN steam_game_url TEXT")
    }
    if (!partnerNames.has("show_wishlists")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN show_wishlists INTEGER NOT NULL DEFAULT 1")
    }
    if (!partnerNames.has("show_views")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN show_views INTEGER NOT NULL DEFAULT 1")
    }
    if (!partnerNames.has("case_gallery")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN case_gallery TEXT")
    }
    if (!partnerNames.has("show_logo_on_case_detail")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN show_logo_on_case_detail INTEGER NOT NULL DEFAULT 1")
    }
    if (!partnerNames.has("related_channel_ids")) {
      sqlite.exec("ALTER TABLE partners ADD COLUMN related_channel_ids TEXT")
    }
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS contact_icons (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      name TEXT NOT NULL,
      s3_key TEXT NOT NULL,
      filter_light TEXT,
      filter_dark TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )
  `)
}
