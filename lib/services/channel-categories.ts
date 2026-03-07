import { getDb } from "@/lib/db"
import { tableChannelCategories, tableChannels } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type {
  GetAllResponse,
  GetOneParams,
  GetOneResponse,
  CreateOneBody,
  CreateOneResponse,
  UpdateOneParams,
  UpdateOneBody,
  UpdateOneResponse,
  DeleteOneParams,
  DeleteOneResponse,
} from "@/lib/schemas/channel-categories"

export class ServiceChannelCategories {
  static getAll(): GetAllResponse {
    const db = getDb()
    const rows = db.select().from(tableChannelCategories).orderBy(tableChannelCategories.order_index).all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const row = db.select().from(tableChannelCategories).where(eq(tableChannelCategories.id, params.id)).get()
    return { data: row ?? null, meta: null }
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    const [created] = db.insert(tableChannelCategories).values(body).returning().all()
    if (!created) throw new Error("Failed to create category")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const set: Record<string, unknown> = {}
    if (body.name_ru !== undefined) set.name_ru = body.name_ru
    if (body.name_en !== undefined) set.name_en = body.name_en
    if (body.order_index !== undefined) set.order_index = body.order_index
    const [updated] = db
      .update(tableChannelCategories)
      .set(set)
      .where(eq(tableChannelCategories.id, params.id))
      .returning()
      .all()
    if (!updated) throw new Error("Category not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    // Unassign channels from this category (set category_id to null)
    db.update(tableChannels)
      .set({ category_id: null })
      .where(eq(tableChannels.category_id, params.id))
      .run()
    db.delete(tableChannelCategories).where(eq(tableChannelCategories.id, params.id)).run()
    return { data: true, meta: null }
  }
}
