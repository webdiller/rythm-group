import { getDb } from "@/lib/db"
import { tableContacts } from "@/lib/db/schema"
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
} from "@/lib/schemas/contacts"

export class ServiceContacts {
  private static getByContextInternal(context: "landing" | "affiliate") {
    const db = getDb()
    const scoped = db.select().from(tableContacts).where(eq(tableContacts.scope, context)).get()
    if (scoped) return scoped
    // Backward compatibility for old DB rows without scope
    const rows = db.select().from(tableContacts).orderBy(tableContacts.id).all()
    if (context === "landing") return rows[0] ?? null
    return rows[1] ?? null
  }

  static getAll(): GetAllResponse {
    const db = getDb()
    const rows = db.select().from(tableContacts).all()
    return { data: rows, meta: null }
  }

  static getOne(params: GetOneParams): GetOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) return { data: null, meta: null }
    const row = db.select().from(tableContacts).where(eq(tableContacts.id, id)).get()
    return { data: row ?? null, meta: null }
  }

  static getByContext(context: "landing" | "affiliate") {
    return this.getByContextInternal(context)
  }

  static createOne(body: CreateOneBody): CreateOneResponse {
    const db = getDb()
    const [created] = db.insert(tableContacts).values(body).returning().all()
    if (!created) throw new Error("Failed to create contact")
    return { data: created, meta: null }
  }

  static updateOne(params: UpdateOneParams, body: UpdateOneBody): UpdateOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const set: Record<string, unknown> = {}
    if (body.email !== undefined) set.email = body.email
    if (body.scope !== undefined) set.scope = body.scope
    if (body.telegram_url !== undefined) set.telegram_url = body.telegram_url
    if (body.telegram_username !== undefined) set.telegram_username = body.telegram_username
    if (body.direct_contacts !== undefined) set.direct_contacts = body.direct_contacts
    const [updated] = db.update(tableContacts).set(set).where(eq(tableContacts.id, id)).returning().all()
    if (!updated) throw new Error("Contact not found")
    return { data: updated, meta: null }
  }

  static deleteOne(params: DeleteOneParams): DeleteOneResponse {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableContacts).where(eq(tableContacts.id, id)).run()
    return { data: true, meta: null }
  }
}
