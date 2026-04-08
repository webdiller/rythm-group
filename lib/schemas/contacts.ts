import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableContacts.select.array(),
})

export const GetOneParams = SharedGetOneParams

export const GetOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableContacts.select.nullable(),
})

export const CreateOneBody = allZodSchemas.tableContacts.insert.pick({
  scope: true,
  email: true,
  telegram_url: true,
  telegram_username: true,
  direct_contacts: true,
  mini_stats: true,
})

export const CreateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableContacts.select,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
  id: z.number(),
  scope: z.string().optional(),
  email: z.string().optional(),
  telegram_url: z.string().optional(),
  telegram_username: z.string().optional().nullable(),
  direct_contacts: z.string().optional().nullable(),
  mini_stats: z.string().optional().nullable(),
})

export const UpdateOneResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableContacts.select,
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
