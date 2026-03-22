import { getDb } from "@/lib/db"
import { tableBlogCategories, tableBlogPosts } from "@/lib/db/schema"
import { and, desc, eq, isNull, ne } from "drizzle-orm"
import { sanitizeBlogHtml } from "@/lib/blog/html-sanitize"
import type { CreatePostBody, PatchPostBody } from "@/lib/schemas/blog-posts"
import { deleteBlogUploadFileByPublicUrl } from "@/lib/blog-local-upload"
import { isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"

function unixNow(): number {
  return Math.floor(Date.now() / 1000)
}

function isoNow(): string {
  return new Date().toISOString()
}

type ListFilters = {
  categoryId?: number
  status?: "draft" | "published"
}

export class ServiceBlogPosts {
  static listForAdmin(filters: ListFilters) {
    const db = getDb()
    const conditions = [isNull(tableBlogPosts.deleted_at)]
    if (filters.categoryId != null) {
      conditions.push(eq(tableBlogPosts.category_id, filters.categoryId))
    }
    if (filters.status != null) {
      conditions.push(eq(tableBlogPosts.status, filters.status))
    }
    const whereClause = and(...conditions)
    const rows = db
      .select({
        id: tableBlogPosts.id,
        category_id: tableBlogPosts.category_id,
        slug: tableBlogPosts.slug,
        title_ru: tableBlogPosts.title_ru,
        title_en: tableBlogPosts.title_en,
        excerpt_ru: tableBlogPosts.excerpt_ru,
        excerpt_en: tableBlogPosts.excerpt_en,
        body_html_ru: tableBlogPosts.body_html_ru,
        body_html_en: tableBlogPosts.body_html_en,
        cover_image_url: tableBlogPosts.cover_image_url,
        status: tableBlogPosts.status,
        published_at: tableBlogPosts.published_at,
        deleted_at: tableBlogPosts.deleted_at,
        created_at: tableBlogPosts.created_at,
        updated_at: tableBlogPosts.updated_at,
        category_slug: tableBlogCategories.slug,
      })
      .from(tableBlogPosts)
      .innerJoin(tableBlogCategories, eq(tableBlogPosts.category_id, tableBlogCategories.id))
      .where(whereClause)
      .orderBy(desc(tableBlogPosts.published_at), desc(tableBlogPosts.created_at))
      .all()
    return { data: rows, meta: null }
  }

  static getByIdForAdmin(id: number) {
    const db = getDb()
    const row = db
      .select({
        id: tableBlogPosts.id,
        category_id: tableBlogPosts.category_id,
        slug: tableBlogPosts.slug,
        title_ru: tableBlogPosts.title_ru,
        title_en: tableBlogPosts.title_en,
        excerpt_ru: tableBlogPosts.excerpt_ru,
        excerpt_en: tableBlogPosts.excerpt_en,
        body_html_ru: tableBlogPosts.body_html_ru,
        body_html_en: tableBlogPosts.body_html_en,
        cover_image_url: tableBlogPosts.cover_image_url,
        status: tableBlogPosts.status,
        published_at: tableBlogPosts.published_at,
        deleted_at: tableBlogPosts.deleted_at,
        created_at: tableBlogPosts.created_at,
        updated_at: tableBlogPosts.updated_at,
        category_slug: tableBlogCategories.slug,
      })
      .from(tableBlogPosts)
      .innerJoin(tableBlogCategories, eq(tableBlogPosts.category_id, tableBlogCategories.id))
      .where(and(eq(tableBlogPosts.id, id), isNull(tableBlogPosts.deleted_at)))
      .get()
    return row ?? null
  }

  static assertCategoryActive(categoryId: number) {
    const db = getDb()
    const cat = db
      .select()
      .from(tableBlogCategories)
      .where(and(eq(tableBlogCategories.id, categoryId), isNull(tableBlogCategories.deleted_at)))
      .get()
    if (!cat) throw new Error("CATEGORY_NOT_FOUND")
    return cat
  }

  static assertSlugFreeInCategory(categoryId: number, slug: string, exceptPostId?: number) {
    const db = getDb()
    const parts = [
      eq(tableBlogPosts.category_id, categoryId),
      eq(tableBlogPosts.slug, slug),
      isNull(tableBlogPosts.deleted_at),
    ] as const
    const whereParts = exceptPostId != null ? [...parts, ne(tableBlogPosts.id, exceptPostId)] : [...parts]
    const row = db
      .select({ id: tableBlogPosts.id })
      .from(tableBlogPosts)
      .where(and(...whereParts))
      .get()
    if (row) throw new Error("SLUG_NOT_UNIQUE")
  }

  static create(body: CreatePostBody) {
    this.assertCategoryActive(body.category_id)
    this.assertSlugFreeInCategory(body.category_id, body.slug)
    const safeRu = sanitizeBlogHtml(body.body_html_ru)
    const safeEn = sanitizeBlogHtml(body.body_html_en)
    const ts = unixNow()
    const publishedAt = body.status === "published" ? ts : ts
    const db = getDb()
    const [created] = db
      .insert(tableBlogPosts)
      .values({
        category_id: body.category_id,
        slug: body.slug,
        title_ru: body.title_ru,
        title_en: body.title_en,
        excerpt_ru: body.excerpt_ru,
        excerpt_en: body.excerpt_en,
        body_html_ru: safeRu,
        body_html_en: safeEn,
        cover_image_url: body.cover_image_url ?? null,
        status: body.status,
        published_at: publishedAt,
        deleted_at: null,
      })
      .returning()
      .all()
    if (!created) throw new Error("CREATE_FAILED")
    const withSlug = this.getByIdForAdmin(created.id)
    return { data: withSlug ?? created, meta: null }
  }

  static async patch(id: number, body: PatchPostBody) {
    const db = getDb()
    const existing = db
      .select()
      .from(tableBlogPosts)
      .where(and(eq(tableBlogPosts.id, id), isNull(tableBlogPosts.deleted_at)))
      .get()
    if (!existing) throw new Error("NOT_FOUND")

    const nextCategoryId = body.category_id ?? existing.category_id
    this.assertCategoryActive(nextCategoryId)

    if (body.slug !== undefined && (body.slug !== existing.slug || nextCategoryId !== existing.category_id)) {
      this.assertSlugFreeInCategory(nextCategoryId, body.slug, id)
    }

    if (body.cover_image_url !== undefined) {
      const oldUrl = existing.cover_image_url
      const newUrl = body.cover_image_url
      if (oldUrl && oldUrl !== newUrl && isLocalBlogUploadUrl(oldUrl)) {
        await deleteBlogUploadFileByPublicUrl(oldUrl)
      }
    }

    let published_at = existing.published_at
    if (body.status === "published" && existing.status === "draft") {
      published_at = body.published_at ?? unixNow()
    } else if (body.published_at !== undefined) {
      published_at = body.published_at
    }

    const safeRu = body.body_html_ru !== undefined ? sanitizeBlogHtml(body.body_html_ru) : undefined
    const safeEn = body.body_html_en !== undefined ? sanitizeBlogHtml(body.body_html_en) : undefined

    const [updated] = db
      .update(tableBlogPosts)
      .set({
        ...(body.category_id !== undefined ? { category_id: body.category_id } : {}),
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.title_ru !== undefined ? { title_ru: body.title_ru } : {}),
        ...(body.title_en !== undefined ? { title_en: body.title_en } : {}),
        ...(body.excerpt_ru !== undefined ? { excerpt_ru: body.excerpt_ru } : {}),
        ...(body.excerpt_en !== undefined ? { excerpt_en: body.excerpt_en } : {}),
        ...(safeRu !== undefined ? { body_html_ru: safeRu } : {}),
        ...(safeEn !== undefined ? { body_html_en: safeEn } : {}),
        ...(body.cover_image_url !== undefined ? { cover_image_url: body.cover_image_url } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        published_at,
        updated_at: isoNow(),
      })
      .where(eq(tableBlogPosts.id, id))
      .returning()
      .all()
    if (!updated) throw new Error("NOT_FOUND")
    const withSlug = this.getByIdForAdmin(id)
    return { data: withSlug ?? updated, meta: null }
  }

  static async softDelete(id: number) {
    const db = getDb()
    const existing = db
      .select()
      .from(tableBlogPosts)
      .where(and(eq(tableBlogPosts.id, id), isNull(tableBlogPosts.deleted_at)))
      .get()
    if (!existing) throw new Error("NOT_FOUND")
    const cover = existing.cover_image_url
    if (cover && isLocalBlogUploadUrl(cover)) {
      await deleteBlogUploadFileByPublicUrl(cover)
    }
    const ts = unixNow()
    db.update(tableBlogPosts)
      .set({ deleted_at: ts, updated_at: isoNow() })
      .where(eq(tableBlogPosts.id, id))
      .run()
    return { data: true, meta: null }
  }
}
