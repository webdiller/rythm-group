import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
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
} from "@/lib/schemas/partners"

export class ServicePartners {
  static getAll(): GetAllResponse {
    const db = getDb()
    const rows = db.select().from(tablePartners).orderBy(tablePartners.order_index).all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) return { data: null, meta: null }
    const row = db.select().from(tablePartners).where(eq(tablePartners.id, id)).get()
    return { data: row ?? null, meta: null }
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    const [created] = db.insert(tablePartners).values(body).returning().all()
    if (!created) throw new Error("Failed to create partner")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const set: Record<string, unknown> = {}
    if (body.name !== undefined) set.name = body.name
    if (body.name_short !== undefined) set.name_short = body.name_short
    if (body.order_index !== undefined) set.order_index = body.order_index
    const [updated] = db.update(tablePartners).set(set).where(eq(tablePartners.id, id)).returning().all()
    if (!updated) throw new Error("Partner not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tablePartners).where(eq(tablePartners.id, id)).run()
    return { data: true, meta: null }
  }
}
