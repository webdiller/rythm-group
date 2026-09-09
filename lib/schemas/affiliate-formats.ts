import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableAffiliateFormats.select.array(),
})

export const CreateOneBody = allZodSchemas.tableAffiliateFormats.insert.omit({
	id: true,
})

export const UpdateOneBody = allZodSchemas.tableAffiliateFormats.update
	.pick({
		id: true,
		title_ru: true,
		title_en: true,
		body_ru: true,
		body_en: true,
		hidden: true,
		order_index: true,
	})
	.extend({ id: z.number() })

export const DeleteOneParams = SharedGetOneParams

export type GetAllResponse = z.infer<typeof GetAllResponse>
export type CreateOneBody = z.infer<typeof CreateOneBody>
export type UpdateOneBody = z.infer<typeof UpdateOneBody>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
