import { z } from "zod"
import { ABOUT_CARD_ICON_MAP } from "@/lib/about-card-icons"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

const iconKeys = Object.keys(ABOUT_CARD_ICON_MAP) as [string, ...string[]]
export const AboutCardIconSchema = z.enum(iconKeys)

/** Ответ API списка: без base64, с флагом своей иконки и S3-ключом (если есть) */
export const AboutCardListItemSchema = z.object({
  id: z.number(),
  icon: z.string(),
  title_ru: z.string(),
  title_en: z.string(),
  text_ru: z.string(),
  text_en: z.string(),
  hidden: z.boolean().nullable(),
  order_index: z.number().nullable(),
  has_custom_icon: z.boolean(),
  /** S3 key `about-cards/...` или null (legacy отдаётся через API) */
  icon_image: z.string().nullable(),
})

export type AboutCardListItem = z.infer<typeof AboutCardListItemSchema>

export const GetAllResponse = SharedDefaultResponse.extend({
  data: z.array(AboutCardListItemSchema),
})

export const CreateOneBody = z.object({
  icon: AboutCardIconSchema,
  title_ru: z.string().min(1),
  title_en: z.string().min(1),
  text_ru: z.string().min(1),
  text_en: z.string().min(1),
  hidden: z.boolean().optional(),
  order_index: z.number().int().optional(),
})

export const UpdateOneBody = z.object({
  id: z.number().int(),
  icon: AboutCardIconSchema.optional(),
  title_ru: z.string().min(1).optional(),
  title_en: z.string().min(1).optional(),
  text_ru: z.string().optional(),
  text_en: z.string().optional(),
  hidden: z.boolean().optional(),
  order_index: z.number().int().optional(),
})

export const DeleteOneParams = SharedGetOneParams

export type GetAllResponse = z.infer<typeof GetAllResponse>
export type CreateOneBody = z.infer<typeof CreateOneBody>
export type UpdateOneBody = z.infer<typeof UpdateOneBody>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>

/** Полная строка БД (в т.ч. base64 в icon_image) — для внутренних типов */
export type AboutCardRow = z.infer<typeof allZodSchemas.tableAboutCards.select>
