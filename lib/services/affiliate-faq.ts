import { getDb } from "@/lib/db"
import { tableAffiliateFaq } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { CreateOneBody, UpdateOneBody, DeleteOneParams } from "@/lib/schemas/affiliate-faq"

export class ServiceAffiliateFaq {
  static getAll() {
    const db = getDb()
    const rows = db.select().from(tableAffiliateFaq).orderBy(tableAffiliateFaq.order_index).all()
    return { data: rows, meta: null }
  }

  static createOne(body: CreateOneBody) {
    const db = getDb()
    const [created] = db.insert(tableAffiliateFaq).values(body).returning().all()
    if (!created) throw new Error("Failed to create FAQ")
    return { data: created, meta: null }
  }

  static updateOne(body: UpdateOneBody) {
    const db = getDb()
    const { id, ...set } = body
    const [updated] = db.update(tableAffiliateFaq).set(set).where(eq(tableAffiliateFaq.id, id)).returning().all()
    if (!updated) throw new Error("FAQ not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams) {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableAffiliateFaq).where(eq(tableAffiliateFaq.id, id)).run()
    return { data: true, meta: null }
  }
}
