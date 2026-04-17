import { getDb } from "@/lib/db"
import { tableAboutCards } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type {
  AboutCardListItem,
  CreateOneBody,
  UpdateOneBody,
  DeleteOneParams,
} from "@/lib/schemas/about-cards"

type AboutCardDbRow = typeof tableAboutCards.$inferSelect

function toListItem(row: AboutCardDbRow): AboutCardListItem {
  const { icon_image: _, ...rest } = row
  return {
    ...rest,
    has_custom_icon: icon_imagePresent(row.icon_image),
  }
}

function icon_imagePresent(v: string | null | undefined): boolean {
  return v != null && v.length > 0
}

export class ServiceAboutCards {
  static getAll() {
    const db = getDb()
    const rows = db.select().from(tableAboutCards).orderBy(tableAboutCards.order_index).all()
    return { data: rows.map(toListItem), meta: null }
  }

  static createOne(body: CreateOneBody) {
    const db = getDb()
    const [created] = db.insert(tableAboutCards).values(body).returning().all()
    if (!created) throw new Error("Failed to create about card")
    return { data: toListItem(created), meta: null }
  }

  static updateOne(body: UpdateOneBody) {
    const db = getDb()
    const { id, ...set } = body
    const [updated] = db
      .update(tableAboutCards)
      .set(set)
      .where(eq(tableAboutCards.id, id))
      .returning()
      .all()
    if (!updated) throw new Error("About card not found")
    return { data: toListItem(updated), meta: null }
  }

  static deleteOne(params: DeleteOneParams) {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    db.delete(tableAboutCards).where(eq(tableAboutCards.id, id)).run()
    return { data: true, meta: null }
  }

  /** Обновление base64-иконки (только из API загрузки) */
  static setIconImage(cardId: number, base64Webp: string | null) {
    const db = getDb()
    const [updated] = db
      .update(tableAboutCards)
      .set({ icon_image: base64Webp })
      .where(eq(tableAboutCards.id, cardId))
      .returning()
      .all()
    if (!updated) throw new Error("About card not found")
    return { data: toListItem(updated), meta: null }
  }
}
