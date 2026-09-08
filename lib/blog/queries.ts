import "server-only"

import { getDb } from "@/lib/db"
import { tableBlogCategories, tableBlogPosts, tableSiteSettings } from "@/lib/db/schema"
import { and, asc, desc, eq, isNull } from "drizzle-orm"
import type { BlogCategory, BlogPost } from "./types"
import { sanitizeBlogHtml } from "./html-sanitize"
import { resolveBlogCoverDisplayUrl } from "@/lib/s3/blog-assets"

function unixToIso(sec: number): string {
  return new Date(sec * 1000).toISOString()
}

function mapCategory(row: typeof tableBlogCategories.$inferSelect): BlogCategory {
  return {
    id: String(row.id),
    slug: row.slug,
    name_ru: row.name_ru,
    name_en: row.name_en,
    order_index: row.order_index,
  }
}

function mapPost(
  row: typeof tableBlogPosts.$inferSelect,
  categorySlug: string
): BlogPost {
  return {
    id: String(row.id),
    category_slug: categorySlug,
    slug: row.slug,
    title_ru: row.title_ru,
    title_en: row.title_en,
    excerpt_ru: row.excerpt_ru,
    excerpt_en: row.excerpt_en,
    cover_image_url: resolveBlogCoverDisplayUrl(row.cover_image_url),
    body_html_ru: sanitizeBlogHtml(row.body_html_ru),
    body_html_en: sanitizeBlogHtml(row.body_html_en),
    published_at: unixToIso(row.published_at),
    created_at: row.created_at ?? unixToIso(row.published_at),
  }
}

/** Настройка «показывать даты» (по умолчанию true). */
export function getBlogShowDatesEnabled(): boolean {
  const db = getDb()
  const row = db.select({ v: tableSiteSettings.blog_show_dates }).from(tableSiteSettings).limit(1).get()
  if (row?.v == null) return true
  return row.v === true
}

export function getAffiliateShowBlogBlockEnabled(): boolean {
  const db = getDb()
  const row = db
    .select({ v: tableSiteSettings.affiliate_show_blog_block })
    .from(tableSiteSettings)
    .limit(1)
    .get()
  if (row?.v == null) return true
  return row.v === true
}

/** До 6 последних опубликованных записей (для /affiliate). */
export function getPublishedPostsForAffiliate(limit = 6): BlogPost[] {
  return getPublishedPosts().slice(0, limit)
}

function sortPostsNewestFirst(a: BlogPost, b: BlogPost): number {
  const pub = b.published_at.localeCompare(a.published_at)
  if (pub !== 0) return pub
  return b.created_at.localeCompare(a.created_at)
}

export function getBlogCategoriesSorted(): BlogCategory[] {
  const db = getDb()
  const rows = db
    .select()
    .from(tableBlogCategories)
    .where(isNull(tableBlogCategories.deleted_at))
    .orderBy(asc(tableBlogCategories.order_index), asc(tableBlogCategories.id))
    .all()
  return rows.map(mapCategory)
}

export function getPublishedPosts(categorySlug?: string | null): BlogPost[] {
  const db = getDb()
  const conditions = [
    eq(tableBlogPosts.status, "published"),
    isNull(tableBlogPosts.deleted_at),
    isNull(tableBlogCategories.deleted_at),
  ]
  if (categorySlug != null && categorySlug !== "") {
    conditions.push(eq(tableBlogCategories.slug, categorySlug))
  }
  const rows = db
    .select({
      post: tableBlogPosts,
      categorySlug: tableBlogCategories.slug,
    })
    .from(tableBlogPosts)
    .innerJoin(tableBlogCategories, eq(tableBlogPosts.category_id, tableBlogCategories.id))
    .where(and(...conditions))
    .orderBy(desc(tableBlogPosts.published_at), desc(tableBlogPosts.created_at))
    .all()

  const mapped = rows.map((r) => mapPost(r.post, r.categorySlug))
  return mapped.sort(sortPostsNewestFirst)
}

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  const db = getDb()
  const row = db
    .select()
    .from(tableBlogCategories)
    .where(and(eq(tableBlogCategories.slug, slug), isNull(tableBlogCategories.deleted_at)))
    .get()
  return row ? mapCategory(row) : undefined
}

export function getPostsByCategorySlug(categorySlug: string): BlogPost[] {
  return getPublishedPosts(categorySlug)
}

export function getPostBySlugs(categorySlug: string, postSlug: string): BlogPost | undefined {
  const db = getDb()
  const row = db
    .select({
      post: tableBlogPosts,
      categorySlug: tableBlogCategories.slug,
    })
    .from(tableBlogPosts)
    .innerJoin(tableBlogCategories, eq(tableBlogPosts.category_id, tableBlogCategories.id))
    .where(
      and(
        eq(tableBlogCategories.slug, categorySlug),
        eq(tableBlogPosts.slug, postSlug),
        eq(tableBlogPosts.status, "published"),
        isNull(tableBlogPosts.deleted_at),
        isNull(tableBlogCategories.deleted_at)
      )
    )
    .get()
  if (!row) return undefined
  return mapPost(row.post, row.categorySlug)
}
