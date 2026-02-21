import Database from "better-sqlite3"
import { fallbackTranslations } from "./i18n"
import { channelCategories, partnerLogos } from "./data"
import path from "path"
import fs from "fs"

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "cms.db")

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) {
    return db
  }

  db = new Database(DB_PATH)
  db.pragma("foreign_keys = ON")

  // Create tables
  initializeDatabase(db)

  return db
}

function initializeDatabase(db: Database.Database) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Translations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      locale TEXT NOT NULL,
      section TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      UNIQUE(locale, section, key)
    )
  `)

  // Channel categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_categories (
      id TEXT PRIMARY KEY,
      name_ru TEXT NOT NULL,
      name_en TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    )
  `)

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      subscribers TEXT NOT NULL,
      url TEXT NOT NULL,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY(category_id) REFERENCES channel_categories(id)
    )
  `)

  // Partners table
  db.exec(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_short TEXT NOT NULL,
      order_index INTEGER DEFAULT 0
    )
  `)

  // Contacts table (single row)
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY DEFAULT 1,
      email TEXT NOT NULL,
      telegram_url TEXT NOT NULL,
      telegram_username TEXT
    )
  `)

  // Migrate existing data if tables are empty
  migrateInitialData(db)
}

function migrateInitialData(db: Database.Database) {
  // Check if translations already exist
  const translationCount = db.prepare("SELECT COUNT(*) as count FROM translations").get() as { count: number }
  if (translationCount.count === 0) {
    // Migrate translations
    const insertTranslation = db.prepare(
      "INSERT OR IGNORE INTO translations (locale, section, key, value) VALUES (?, ?, ?, ?)"
    )

    for (const [locale, localeData] of Object.entries(fallbackTranslations)) {
      for (const [section, sectionData] of Object.entries(localeData)) {
        function insertNested(prefix: string, data: any) {
          for (const [key, value] of Object.entries(data)) {
            const fullKey = prefix ? `${prefix}.${key}` : key
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
              insertNested(fullKey, value)
            } else if (Array.isArray(value)) {
              // Store arrays as JSON strings
              insertTranslation.run(locale, section, fullKey, JSON.stringify(value))
            } else {
              insertTranslation.run(locale, section, fullKey, String(value))
            }
          }
        }
        insertNested("", sectionData)
      }
    }
  }

  // Check if channel categories already exist
  const categoryCount = db.prepare("SELECT COUNT(*) as count FROM channel_categories").get() as { count: number }
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(
      "INSERT OR IGNORE INTO channel_categories (id, name_ru, name_en, order_index) VALUES (?, ?, ?, ?)"
    )
    const insertChannel = db.prepare(
      "INSERT INTO channels (category_id, name, subscribers, url, order_index) VALUES (?, ?, ?, ?, ?)"
    )

    channelCategories.forEach((category, catIndex) => {
      insertCategory.run(category.id, category.nameRu, category.nameEn, catIndex)
      category.channels.forEach((channel, chIndex) => {
        insertChannel.run(category.id, channel.name, channel.subscribers, channel.url, chIndex)
      })
    })
  }

  // Check if partners already exist
  const partnerCount = db.prepare("SELECT COUNT(*) as count FROM partners").get() as { count: number }
  if (partnerCount.count === 0) {
    const insertPartner = db.prepare(
      "INSERT INTO partners (name, name_short, order_index) VALUES (?, ?, ?)"
    )
    partnerLogos.forEach((partner, index) => {
      insertPartner.run(partner.name, partner.nameShort, index)
    })
  }

  // Check if contacts already exist
  const contactCount = db.prepare("SELECT COUNT(*) as count FROM contacts").get() as { count: number }
  if (contactCount.count === 0) {
    db.prepare("INSERT INTO contacts (id, email, telegram_url, telegram_username) VALUES (1, ?, ?, ?)").run(
      "contact@rythmgroup.com",
      "https://t.me/rythmgroup",
      "@rythmgroup"
    )
  }
}

// Helper function to get nested translation value
export function getNestedValue(obj: any, path: string): string | undefined {
  return path.split(".").reduce((current, key) => current?.[key], obj)
}

// Helper function to set nested translation value
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".")
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}
