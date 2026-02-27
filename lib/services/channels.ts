import { getDb } from "@/lib/db"
import { tableChannels, tableChannelCategories } from "@/lib/db/schema"
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
} from "@/lib/schemas/channels"

export class ServiceChannels {
  static getAll(): GetAllResponse {
    const db = getDb()
    const rows = db
      .select({
        id: tableChannels.id,
        category_id: tableChannels.category_id,
        avatar: tableChannels.avatar,
        name: tableChannels.name,
        subscribers: tableChannels.subscribers,
        url: tableChannels.url,
        order_index: tableChannels.order_index,
        category_name_ru: tableChannelCategories.name_ru,
        category_name_en: tableChannelCategories.name_en,
      })
      .from(tableChannels)
      .leftJoin(tableChannelCategories, eq(tableChannels.category_id, tableChannelCategories.id))
      .orderBy(tableChannels.category_id, tableChannels.order_index)
      .all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) return { data: null, meta: null }
    const row = db.select().from(tableChannels).where(eq(tableChannels.id, id)).get()
    return { data: row ?? null, meta: null }
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    const [created] = db.insert(tableChannels).values(body).returning().all()
    if (!created) throw new Error("Failed to create channel")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const set: Record<string, unknown> = {}
    if (body.category_id !== undefined) set.category_id = body.category_id
    if (body.name !== undefined) set.name = body.name
    if (body.subscribers !== undefined) set.subscribers = body.subscribers
    if (body.url !== undefined) set.url = body.url
    if (body.order_index !== undefined) set.order_index = body.order_index
    if (body.avatar !== undefined) set.avatar = body.avatar
    const [updated] = db.update(tableChannels).set(set).where(eq(tableChannels.id, id)).returning().all()
    if (!updated) throw new Error("Channel not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableChannels).where(eq(tableChannels.id, id)).run()
    return { data: true, meta: null }
  }
}
