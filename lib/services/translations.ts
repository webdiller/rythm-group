import { getDb } from "@/lib/db"
import { tableTranslations } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import type {
  GetAllQueryParams,
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
} from "@/lib/schemas/translations"

export class ServiceTranslations {
  static getAll(query: GetAllQueryParams): GetAllResponse {
    const db = getDb()
    let q = db.select().from(tableTranslations).orderBy(tableTranslations.locale, tableTranslations.section, tableTranslations.key)
    const conditions: ReturnType<typeof eq>[] = []
    if (query.locale) conditions.push(eq(tableTranslations.locale, query.locale))
    if (query.section) conditions.push(eq(tableTranslations.section, query.section))
    const rows = conditions.length
      ? db.select().from(tableTranslations).where(and(...conditions)).orderBy(tableTranslations.locale, tableTranslations.section, tableTranslations.key).all()
      : q.all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) return { data: null, meta: null }
    const row = db.select().from(tableTranslations).where(eq(tableTranslations.id, id)).get()
    return { data: row ?? null, meta: null }
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    const [created] = db.insert(tableTranslations).values(body).returning().all()
    if (!created) throw new Error("Failed to create translation")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const updateData = { ...body, id: undefined } as Record<string, unknown>
    delete updateData.id
    const [updated] = db.update(tableTranslations).set(updateData).where(eq(tableTranslations.id, id)).returning().all()
    if (!updated) throw new Error("Translation not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableTranslations).where(eq(tableTranslations.id, id)).run()
    return { data: true, meta: null }
  }
}
