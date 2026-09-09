import { z } from "zod"
import { SharedDefaultResponse } from "@/lib/types"
import { KEBAB_SLUG_REGEX } from "@/lib/blog/slug"

const kebabSlug = z.string().regex(KEBAB_SLUG_REGEX, "slug: латиница, kebab-case")

export const CreateCategoryBody = z.object({
	slug: kebabSlug,
	name_ru: z.string().min(1),
	name_en: z.string().min(1),
	order_index: z.number().int().optional(),
})

export const PatchCategoryBody = z
	.object({
		slug: kebabSlug.optional(),
		name_ru: z.string().min(1).optional(),
		name_en: z.string().min(1).optional(),
		order_index: z.number().int().optional(),
	})
	.refine((o) => Object.keys(o).length > 0, { message: "empty patch" })

export const CategoryRow = z.object({
	id: z.number(),
	slug: z.string(),
	name_ru: z.string(),
	name_en: z.string(),
	order_index: z.number(),
	deleted_at: z.number().nullable(),
	created_at: z.string(),
})

export const CategoriesListResponse = SharedDefaultResponse.extend({
	data: z.array(CategoryRow),
})

export type CreateCategoryBody = z.infer<typeof CreateCategoryBody>
export type PatchCategoryBody = z.infer<typeof PatchCategoryBody>
