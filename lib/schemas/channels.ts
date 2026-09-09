import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableChannels.select
		.extend({
			category_name_ru: z.string().nullish(),
			category_name_en: z.string().nullish(),
		})
		.array(),
})

export const GetOneParams = SharedGetOneParams

export const GetOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableChannels.select.nullable(),
})

export const CreateOneBody = z.object({
	category_id: z.string().nullable().optional(),
	name: allZodSchemas.tableChannels.insert.shape.name,
	subscribers: allZodSchemas.tableChannels.insert.shape.subscribers,
	reach: allZodSchemas.tableChannels.insert.shape.reach.optional(),
	url: allZodSchemas.tableChannels.insert.shape.url,
	order_index: allZodSchemas.tableChannels.insert.shape.order_index.optional(),
	avatar: allZodSchemas.tableChannels.insert.shape.avatar.optional(),
})

export const CreateOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableChannels.select,
})

export const UpdateOneParams = SharedGetOneParams

export const UpdateOneBody = z.object({
	id: z.number(),
	category_id: z.string().nullable().optional(),
	name: z.string().optional(),
	subscribers: z.string().optional(),
	reach: z.string().optional().nullable(),
	url: z.string().optional(),
	order_index: z.number().optional(),
	avatar: z.string().nullable().optional(),
})

export const UpdateOneResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableChannels.select,
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
