import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deletePartnerLogoIfStored } from "@/lib/s3/partner-logo"
import { deletePartnerCaseGalleryAll } from "@/lib/s3/partner-gallery"
import type { GetAllResponse, GetOneParams, GetOneResponse, CreateOneBody, CreateOneResponse, UpdateOneParams, UpdateOneBody, UpdateOneResponse, DeleteOneParams, DeleteOneResponse } from "@/lib/schemas/partners"

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
    if (body.category_id !== undefined) set.category_id = body.category_id
    if (body.name !== undefined) set.name = body.name
    if (body.logo_url !== undefined) set.logo_url = body.logo_url
    if (body.title_ru !== undefined) set.title_ru = body.title_ru
    if (body.title_en !== undefined) set.title_en = body.title_en
    if (body.short_description_ru !== undefined) set.short_description_ru = body.short_description_ru
    if (body.short_description_en !== undefined) set.short_description_en = body.short_description_en
    if (body.published_at !== undefined) set.published_at = body.published_at
    if (body.wishlists !== undefined) set.wishlists = body.wishlists
    if (body.views !== undefined) set.views = body.views
    if (body.target_url !== undefined) set.target_url = body.target_url
    if (body.developer_url !== undefined) set.developer_url = body.developer_url
    if (body.steam_game_url !== undefined) set.steam_game_url = body.steam_game_url
    if (body.show_in_landing_cases !== undefined) set.show_in_landing_cases = body.show_in_landing_cases
    if (body.show_in_affiliate_cases !== undefined) set.show_in_affiliate_cases = body.show_in_affiliate_cases
    if (body.show_in_affiliate_steam !== undefined) set.show_in_affiliate_steam = body.show_in_affiliate_steam
    if (body.show_wishlists !== undefined) set.show_wishlists = body.show_wishlists
    if (body.show_views !== undefined) set.show_views = body.show_views
    if (body.case_gallery !== undefined) set.case_gallery = body.case_gallery
    if (body.show_logo_on_case_detail !== undefined) {
      set.show_logo_on_case_detail = body.show_logo_on_case_detail
    }
    if (body.related_channel_ids !== undefined) set.related_channel_ids = body.related_channel_ids
    if (body.order_index !== undefined) set.order_index = body.order_index
    const [updated] = db.update(tablePartners).set(set).where(eq(tablePartners.id, id)).returning().all()
    if (!updated) throw new Error("Partner not found")
    return { data: updated, meta: null }
  }

  static async deleteOne(params: DeleteOneParams): Promise<DeleteOneResponse> {
    const db = getDb()
    const id = Number(params.id)
    if (Number.isNaN(id)) throw new Error("Invalid id")
    const existing = db
      .select({
        logo_url: tablePartners.logo_url,
        case_gallery: tablePartners.case_gallery,
      })
      .from(tablePartners)
      .where(eq(tablePartners.id, id))
      .get()
    db.delete(tablePartners).where(eq(tablePartners.id, id)).run()
    await deletePartnerLogoIfStored(existing?.logo_url)
    await deletePartnerCaseGalleryAll(existing?.case_gallery)
    return { data: true, meta: null }
  }
}
