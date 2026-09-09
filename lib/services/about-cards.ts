import { getDb } from "@/lib/db"
import { tableAboutCards } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deleteAboutIconIfStored } from "@/lib/s3/about-icon"
import { isAboutIconS3Key } from "@/lib/s3/about-icon-url"
import type { AboutCardListItem, CreateOneBody, UpdateOneBody, DeleteOneParams } from "@/lib/schemas/about-cards"

type AboutCardDbRow = typeof tableAboutCards.$inferSelect

function toListItem(row: AboutCardDbRow): AboutCardListItem {
  const { icon_image, ...rest } = row
  return {
    ...rest,
    has_custom_icon: icon_imagePresent(icon_image),
    icon_image: isAboutIconS3Key(icon_image) ? icon_image!.trim() : null,
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
    const [updated] = db.update(tableAboutCards).set(set).where(eq(tableAboutCards.id, id)).returning().all()
    if (!updated) throw new Error("About card not found")
    return { data: toListItem(updated), meta: null }
  }

  static async deleteOne(params: DeleteOneParams) {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const existing = db.select({ icon_image: tableAboutCards.icon_image }).from(tableAboutCards).where(eq(tableAboutCards.id, id)).get()
    db.delete(tableAboutCards).where(eq(tableAboutCards.id, id)).run()
    await deleteAboutIconIfStored(existing?.icon_image)
    return { data: true, meta: null }
  }

  /** Запись ключа S3 или null (только из API загрузки иконки). */
  static setIconImage(cardId: number, iconImage: string | null) {
    const db = getDb()
    const [updated] = db.update(tableAboutCards).set({ icon_image: iconImage }).where(eq(tableAboutCards.id, cardId)).returning().all()
    if (!updated) throw new Error("About card not found")
    return { data: toListItem(updated), meta: null }
  }

  static getIconImageRaw(cardId: number): string | null {
    const db = getDb()
    const row = db.select({ icon_image: tableAboutCards.icon_image }).from(tableAboutCards).where(eq(tableAboutCards.id, cardId)).get()
    return row?.icon_image ?? null
  }
}
