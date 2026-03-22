import { getDb } from "@/lib/db"
import { tableBlogCategories, tableBlogPosts } from "@/lib/db/schema"
import { and, eq, isNull, asc, ne } from "drizzle-orm"
import type { CreateCategoryBody, PatchCategoryBody } from "@/lib/schemas/blog-categories"

function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

function isoNow(): string {
  return new Date().toISOString()
}

export class ServiceBlogCategories {
  static listForAdmin(includeDeleted: boolean) {
    const db = getDb()
    const q = db.select().from(tableBlogCategories)
    const rows = includeDeleted
      ? q.orderBy(asc(tableBlogCategories.order_index), asc(tableBlogCategories.id)).all()
      : q
          .where(isNull(tableBlogCategories.deleted_at))
          .orderBy(asc(tableBlogCategories.order_index), asc(tableBlogCategories.id))
          .all()
    return { data: rows, meta: null }
  }

  static getById(id: number) {
    const db = getDb()
    const row = db.select().from(tableBlogCategories).where(eq(tableBlogCategories.id, id)).get()
    return row ?? null
  }

  static create(body: CreateCategoryBody) {
    const db = getDb()
    const clash = db
      .select({ id: tableBlogCategories.id })
      .from(tableBlogCategories)
      .where(and(eq(tableBlogCategories.slug, body.slug), isNull(tableBlogCategories.deleted_at)))
      .get()
    if (clash) {
      throw new Error("SLUG_NOT_UNIQUE")
    }
    const [created] = db
      .insert(tableBlogCategories)
      .values({
        slug: body.slug,
        name_ru: body.name_ru,
        name_en: body.name_en,
        order_index: body.order_index ?? 0,
        deleted_at: null,
      })
      .returning()
      .all()
    if (!created) throw new Error("CREATE_FAILED")
    return { data: created, meta: null }
  }

  static patch(id: number, body: PatchCategoryBody) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing || existing.deleted_at != null) {
      throw new Error("NOT_FOUND")
    }
    if (body.slug !== undefined && body.slug !== existing.slug) {
      const clash = db
        .select({ id: tableBlogCategories.id })
        .from(tableBlogCategories)
        .where(
          and(eq(tableBlogCategories.slug, body.slug), isNull(tableBlogCategories.deleted_at), ne(tableBlogCategories.id, id))
        )
        .get()
      if (clash) throw new Error("SLUG_NOT_UNIQUE")
    }
    const [updated] = db
      .update(tableBlogCategories)
      .set({
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.name_ru !== undefined ? { name_ru: body.name_ru } : {}),
        ...(body.name_en !== undefined ? { name_en: body.name_en } : {}),
        ...(body.order_index !== undefined ? { order_index: body.order_index } : {}),
      })
      .where(eq(tableBlogCategories.id, id))
      .returning()
      .all()
    if (!updated) throw new Error("NOT_FOUND")
    return { data: updated, meta: null }
  }

  /** Soft delete категории и всех её постов (ТЗ). */
  static softDeleteCategory(id: number) {
    const db = getDb()
    const existing = this.getById(id)
    if (!existing || existing.deleted_at != null) {
      throw new Error("NOT_FOUND")
    }
    const ts = unixNow()
    const nowIso = isoNow()
    db.transaction((tx) => {
      tx.update(tableBlogCategories).set({ deleted_at: ts }).where(eq(tableBlogCategories.id, id)).run()
      tx.update(tableBlogPosts)
        .set({ deleted_at: ts, updated_at: nowIso })
        .where(and(eq(tableBlogPosts.category_id, id), isNull(tableBlogPosts.deleted_at)))
        .run()
    })
    return { data: true, meta: null }
  }
}
