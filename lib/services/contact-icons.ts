import { getDb } from "@/lib/db"
import { tableContactIcons, tableContacts } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import {
  DEFAULT_ICON_FILTERS,
  parseIconFilters,
  serializeIconFilters,
  type IconCssFilters,
} from "@/lib/contact-icons/filters"
import { deleteContactIconIfStored } from "@/lib/s3/contact-icon"
import type { ContactIconItem, UpdateOneBody } from "@/lib/schemas/contact-icons"

type ContactIconDbRow = typeof tableContactIcons.$inferSelect

function toItem(row: ContactIconDbRow): ContactIconItem {
  const filter_light = parseIconFilters(row.filter_light)
  let filter_dark: IconCssFilters | null = null
  if (row.filter_dark != null && row.filter_dark.trim() !== "") {
    filter_dark = parseIconFilters(row.filter_dark)
  }
  return {
    id: row.id,
    name: row.name,
    s3_key: row.s3_key,
    filter_light,
    filter_dark,
    order_index: row.order_index ?? 0,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  }
}

function collectUsedIconIds(): Set<number> {
  const db = getDb()
  const rows = db.select({ direct_contacts: tableContacts.direct_contacts }).from(tableContacts).all()
  const used = new Set<number>()
  for (const row of rows) {
    if (!row.direct_contacts) continue
    try {
      const parsed = JSON.parse(row.direct_contacts) as unknown
      if (!Array.isArray(parsed)) continue
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue
        const id = (item as { icon_id?: unknown }).icon_id
        if (typeof id === "number" && Number.isFinite(id)) used.add(id)
        if (typeof id === "string" && id.trim() !== "" && !Number.isNaN(Number(id))) {
          used.add(Number(id))
        }
      }
    } catch {
      /* ignore broken JSON */
    }
  }
  return used
}

export class ServiceContactIcons {
  static getAll(): { data: ContactIconItem[]; meta: null } {
    const db = getDb()
    const rows = db.select().from(tableContactIcons).orderBy(asc(tableContactIcons.order_index), asc(tableContactIcons.id)).all()
    return { data: rows.map(toItem), meta: null }
  }

  static getOne(id: number): ContactIconItem | null {
    const db = getDb()
    const row = db.select().from(tableContactIcons).where(eq(tableContactIcons.id, id)).get()
    return row ? toItem(row) : null
  }

  static createOne(input: {
    name: string
    s3_key: string
    filter_light?: IconCssFilters
    filter_dark?: IconCssFilters | null
  }): ContactIconItem {
    const db = getDb()
    const maxOrder = db
      .select({ order_index: tableContactIcons.order_index })
      .from(tableContactIcons)
      .orderBy(asc(tableContactIcons.order_index))
      .all()
    const nextOrder =
      maxOrder.length === 0 ? 0 : Math.max(...maxOrder.map((r) => r.order_index ?? 0)) + 1

    const [created] = db
      .insert(tableContactIcons)
      .values({
        name: input.name.trim() || "icon",
        s3_key: input.s3_key,
        filter_light: serializeIconFilters(input.filter_light ?? DEFAULT_ICON_FILTERS),
        filter_dark:
          input.filter_dark === undefined || input.filter_dark === null
            ? null
            : serializeIconFilters(input.filter_dark),
        order_index: nextOrder,
        updated_at: new Date().toISOString(),
      })
      .returning()
      .all()

    if (!created) throw new Error("Failed to create contact icon")
    return toItem(created)
  }

  static updateOne(body: UpdateOneBody): ContactIconItem {
    const db = getDb()
    const set: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (body.name !== undefined) set.name = body.name.trim()
    if (body.filter_light !== undefined) set.filter_light = serializeIconFilters(body.filter_light)
    if (body.filter_dark !== undefined) {
      set.filter_dark = body.filter_dark === null ? null : serializeIconFilters(body.filter_dark)
    }
    const [updated] = db
      .update(tableContactIcons)
      .set(set)
      .where(eq(tableContactIcons.id, body.id))
      .returning()
      .all()
    if (!updated) throw new Error("Contact icon not found")
    return toItem(updated)
  }

  static setS3Key(id: number, s3Key: string): ContactIconItem {
    const db = getDb()
    const [updated] = db
      .update(tableContactIcons)
      .set({ s3_key: s3Key, updated_at: new Date().toISOString() })
      .where(eq(tableContactIcons.id, id))
      .returning()
      .all()
    if (!updated) throw new Error("Contact icon not found")
    return toItem(updated)
  }

  static getS3KeyRaw(id: number): string | null {
    const db = getDb()
    const row = db.select({ s3_key: tableContactIcons.s3_key }).from(tableContactIcons).where(eq(tableContactIcons.id, id)).get()
    return row?.s3_key ?? null
  }

  static reorder(ids: number[]): ContactIconItem[] {
    const db = getDb()
    const existing = db.select().from(tableContactIcons).all()
    const byId = new Map(existing.map((r) => [r.id, r]))
    for (const id of ids) {
      if (!byId.has(id)) throw new Error(`Contact icon not found: ${id}`)
    }
    ids.forEach((id, index) => {
      db.update(tableContactIcons)
        .set({ order_index: index, updated_at: new Date().toISOString() })
        .where(eq(tableContactIcons.id, id))
        .run()
    })
    return this.getAll().data
  }

  static isInUse(id: number): boolean {
    return collectUsedIconIds().has(id)
  }

  static async deleteOne(id: number): Promise<void> {
    if (this.isInUse(id)) {
      throw new Error("ICON_IN_USE")
    }
    const db = getDb()
    const existing = db.select().from(tableContactIcons).where(eq(tableContactIcons.id, id)).get()
    if (!existing) throw new Error("Contact icon not found")
    db.delete(tableContactIcons).where(eq(tableContactIcons.id, id)).run()
    await deleteContactIconIfStored(existing.s3_key)
  }
}
