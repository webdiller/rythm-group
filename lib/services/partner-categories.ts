import { getDb } from "@/lib/db"
import { tablePartnerCategories, tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { GetAllResponse, GetOneParams, GetOneResponse, CreateOneBody, CreateOneResponse, UpdateOneParams, UpdateOneBody, UpdateOneResponse, DeleteOneParams, DeleteOneResponse } from "@/lib/schemas/partner-categories"

export class ServicePartnerCategories {
  static getAll(): GetAllResponse {
    const db = getDb()
    const rows = db.select().from(tablePartnerCategories).orderBy(tablePartnerCategories.order_index).all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) return { data: null, meta: null }
    const row = db.select().from(tablePartnerCategories).where(eq(tablePartnerCategories.id, id)).get()
    return { data: row ?? null, meta: null }
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    // Keep legacy "name" column in sync with Russian title for backward compatibility
    const payload = {
      ...body,
      name: body.name_ru,
    }
    const [created] = db.insert(tablePartnerCategories).values(payload).returning().all()
    if (!created) throw new Error("Failed to create partner category")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const set: Record<string, unknown> = {}
    if (body.name_ru !== undefined) {
      set.name_ru = body.name_ru
      // Also update legacy "name" column to keep it in sync
      set.name = body.name_ru
    }
    if (body.name_en !== undefined) {
      set.name_en = body.name_en
    }
    if (body.order_index !== undefined) set.order_index = body.order_index
    const [updated] = db.update(tablePartnerCategories).set(set).where(eq(tablePartnerCategories.id, id)).returning().all()
    if (!updated) throw new Error("Partner category not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")

    // Unassign partners from this category (set category_id to null)
    db.update(tablePartners).set({ category_id: null }).where(eq(tablePartners.category_id, id)).run()

    db.delete(tablePartnerCategories).where(eq(tablePartnerCategories.id, id)).run()
    return { data: true, meta: null }
  }
}
