import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse } from "@/lib/types"

export const GetResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableAffiliateHero.select.nullable(),
})

export const UpsertBody = allZodSchemas.tableAffiliateHero.insert.omit({
	id: true,
})

export const UpsertResponse = SharedDefaultResponse.extend({
	data: allZodSchemas.tableAffiliateHero.select,
})

export type GetResponse = z.infer<typeof GetResponse>
export type UpsertBody = z.infer<typeof UpsertBody>
export type UpsertResponse = z.infer<typeof UpsertResponse>
