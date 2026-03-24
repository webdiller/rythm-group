import { getDb } from "@/lib/db"
import { tableAffiliateFormats } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type {
  CreateOneBody,
  UpdateOneBody,
  DeleteOneParams,
} from "@/lib/schemas/affiliate-formats"

export class ServiceAffiliateFormats {
  static getAll() {
    const db = getDb()
    const rows = db.select().from(tableAffiliateFormats).orderBy(tableAffiliateFormats.order_index).all()
    return { data: rows, meta: null }
  }

  static createOne(body: CreateOneBody) {
    const db = getDb()
    const [created] = db.insert(tableAffiliateFormats).values(body).returning().all()
    if (!created) throw new Error("Failed to create format")
    return { data: created, meta: null }
  }

  static updateOne(body: UpdateOneBody) {
    const db = getDb()
    const { id, ...set } = body
    const [updated] = db.update(tableAffiliateFormats).set(set).where(eq(tableAffiliateFormats.id, id)).returning().all()
    if (!updated) throw new Error("Format not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams) {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableAffiliateFormats).where(eq(tableAffiliateFormats.id, id)).run()
    return { data: true, meta: null }
  }
}
