import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableChannelCategories.select.array() as unknown as z.ZodTypeAny,
})

export const GetOneParams = z.object({ id: z.string() })

export const GetOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableChannelCategories.select.nullable() as unknown as z.ZodTypeAny,
})

export const CreateOneBody = allZodSchemas.tableChannelCategories.insert.pick({
  id: true,
  name_ru: true,
  name_en: true,
  order_index: true,
}) as unknown as z.ZodTypeAny

export const CreateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableChannelCategories.select as unknown as z.ZodTypeAny,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
  id: z.string(),
  name_ru: z.string().optional(),
  name_en: z.string().optional(),
  order_index: z.number().optional(),
})

export const UpdateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableChannelCategories.select as unknown as z.ZodTypeAny,
})

export const DeleteOneParams = z.object({ id: z.string() })

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
