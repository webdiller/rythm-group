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
  name: true,
  name_short: true,
  order_index: true,
})

export const CreateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tablePartners.select,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
  id: z.number(),
  name: z.string().optional(),
  name_short: z.string().optional(),
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
export type UpdateOneBody = { id: number; name?: string; name_short?: string; order_index?: number }
export type UpdateOneResponse = z.infer<typeof UpdateOneResponse>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
export type DeleteOneResponse = z.infer<typeof DeleteOneResponse>
