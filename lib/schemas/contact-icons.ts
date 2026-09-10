import { z } from "zod"
import { SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"
import { IconCssFiltersSchema } from "@/lib/contact-icons/filters"

export const ContactIconItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  s3_key: z.string(),
  filter_light: IconCssFiltersSchema,
  filter_dark: IconCssFiltersSchema.nullable(),
  order_index: z.number(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
})

export type ContactIconItem = z.infer<typeof ContactIconItemSchema>

export const GetAllResponse = SharedDefaultResponse.extend({
  data: z.array(ContactIconItemSchema),
})

export const UpdateOneBody = z.object({
  id: z.number().int(),
  name: z.string().min(1).optional(),
  filter_light: IconCssFiltersSchema.optional(),
  /** null — сбросить тёмный фильтр (использовать светлый) */
  filter_dark: IconCssFiltersSchema.nullable().optional(),
})

export const ReorderBody = z.object({
  ids: z.array(z.number().int()).min(1),
})

export const DeleteOneParams = SharedGetOneParams

export type UpdateOneBody = z.infer<typeof UpdateOneBody>
export type ReorderBody = z.infer<typeof ReorderBody>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
