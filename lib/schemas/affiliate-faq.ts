import { z } from "zod"
import { allZodSchemas, SharedDefaultResponse, SharedGetOneParams } from "@/lib/types"

export const GetAllResponse = SharedDefaultResponse.extend({
  data: allZodSchemas.tableAffiliateFaq.select.array(),
})

export const CreateOneBody = allZodSchemas.tableAffiliateFaq.insert.omit({
  id: true,
})

export const UpdateOneBody = allZodSchemas.tableAffiliateFaq.update
  .pick({
    id: true,
    question_ru: true,
    question_en: true,
    answer_ru: true,
    answer_en: true,
    hidden: true,
    order_index: true,
  })
  .extend({ id: z.number() })

export const DeleteOneParams = SharedGetOneParams

export type GetAllResponse = z.infer<typeof GetAllResponse>
export type CreateOneBody = z.infer<typeof CreateOneBody>
export type UpdateOneBody = z.infer<typeof UpdateOneBody>
export type DeleteOneParams = z.infer<typeof DeleteOneParams>
