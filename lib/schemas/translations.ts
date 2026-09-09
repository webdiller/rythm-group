import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllQueryParams = z.object({
	locale: z.string().optional(),
	section: z.string().optional(),
})

export const GetAllResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableTranslations.select.array(),
})

export const GetOneParams = SharedGetOneParams

export const GetOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableTranslations.select.nullable(),
})

export const CreateOneBody = allZodSchemas.tableTranslations.insert.pick({
	locale: true,
	section: true,
	key: true,
	value: true,
})

export const CreateOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableTranslations.select,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
	locale: z.string().optional(),
	section: z.string().optional(),
	key: z.string().optional(),
	value: z.string().optional(),
})

export const UpdateOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableTranslations.select,
})

export const DeleteOneParams = SharedGetOneParams

export const DeleteOneResponse = SharedDefaultResponse.extend({
	data: z.boolean(),
})

export type GetAllQueryParams = z.infer<typeof GetAllQueryParams>
export type GetAllResponse = z.infer<typeof GetAllResponse>
export type GetOneParams = z.infer<typeof GetOneParams>
export type GetOneResponse = z.infer<typeof GetOneResponse>
export type CreateOneBody = z.infer<typeof CreateOneBody>
export type CreateOneResponse = z.infer<typeof CreateOneResponse>
export type UpdateOneParams = z.infer<typeof UpdateOneParams>
export type UpdateOneBody = { locale?: string; section?: string; key?: string; value?: string }
export type UpdateOneResponse = z.infer<typeof UpdateOneResponse>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
export type DeleteOneResponse = z.infer<typeof DeleteOneResponse>
