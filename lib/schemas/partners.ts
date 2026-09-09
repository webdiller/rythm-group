import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tablePartners.select.array(),
})

export const GetOneParams = SharedGetOneParams

export const GetOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tablePartners.select.nullable(),
})

export const CreateOneBody = allZodSchemas.tablePartners.insert.pick({
  category_id: true,
  name: true,
  logo_url: true,
  title_ru: true,
  title_en: true,
  short_description_ru: true,
  short_description_en: true,
  published_at: true,
  wishlists: true,
  views: true,
  target_url: true,
  developer_url: true,
  steam_game_url: true,
  show_in_landing_cases: true,
  show_in_affiliate_cases: true,
  show_in_affiliate_steam: true,
  show_wishlists: true,
  show_views: true,
  show_logo_on_case_detail: true,
  related_channel_ids: true,
  order_index: true,
})

export const CreateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tablePartners.select,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
  id: z.number(),
  category_id: z.number().nullable().optional(),
  name: z.string().optional(),
  logo_url: z.string().nullable().optional(),
  title_ru: z.string().nullable().optional(),
  title_en: z.string().nullable().optional(),
  short_description_ru: z.string().nullable().optional(),
  short_description_en: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  wishlists: z.number().optional(),
  views: z.number().optional(),
  target_url: z.string().nullable().optional(),
  developer_url: z.string().nullable().optional(),
  steam_game_url: z.string().nullable().optional(),
  show_in_landing_cases: z.boolean().optional(),
  show_in_affiliate_cases: z.boolean().optional(),
  show_in_affiliate_steam: z.boolean().optional(),
  show_wishlists: z.boolean().optional(),
  show_views: z.boolean().optional(),
  case_gallery: z.string().nullable().optional(),
  show_logo_on_case_detail: z.boolean().optional(),
  related_channel_ids: z.string().nullable().optional(),
  order_index: z.number().optional(),
})

export const UpdateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tablePartners.select,
})

export const DeleteOneParams = SharedGetOneParams

export const DeleteOneResponse = SharedDefaultResponse.extend({
  data: z.boolean(),
})

export type GetAllResponse = z.infer<typeof GetAllResponse>
export type GetOneParams = z.infer<typeof GetOneParams>
export type GetOneResponse = z.infer<typeof GetOneResponse>
export type CreateOneBody = z.infer<typeof CreateOneBody>
export type CreateOneResponse = z.infer<typeof CreateOneResponse>
export type UpdateOneParams = z.infer<typeof UpdateOneParams>
export type UpdateOneBody = z.infer<typeof UpdateOneBody>
export type UpdateOneResponse = z.infer<typeof UpdateOneResponse>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
export type DeleteOneResponse = z.infer<typeof DeleteOneResponse>
