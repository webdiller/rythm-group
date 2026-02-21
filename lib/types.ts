import { z } from "zod"
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod"
import {
  tableUsers,
  tableTranslations,
  tableChannelCategories,
  tableChannels,
  tablePartners,
  tableContacts,
} from "./db/schema"

export const allZodSchemas = {
  tableUsers: {
    select: createSelectSchema(tableUsers),
    insert: createInsertSchema(tableUsers),
    update: createUpdateSchema(tableUsers),
  },
  tableTranslations: {
    select: createSelectSchema(tableTranslations),
    insert: createInsertSchema(tableTranslations),
    update: createUpdateSchema(tableTranslations),
  },
  tableChannelCategories: {
    select: createSelectSchema(tableChannelCategories),
    insert: createInsertSchema(tableChannelCategories),
    update: createUpdateSchema(tableChannelCategories),
  },
  tableChannels: {
    select: createSelectSchema(tableChannels),
    insert: createInsertSchema(tableChannels),
    update: createUpdateSchema(tableChannels),
  },
  tablePartners: {
    select: createSelectSchema(tablePartners),
    insert: createInsertSchema(tablePartners),
    update: createUpdateSchema(tablePartners),
  },
  tableContacts: {
    select: createSelectSchema(tableContacts),
    insert: createInsertSchema(tableContacts),
    update: createUpdateSchema(tableContacts),
  },
}

export const SharedDefaultResponse = z.object({
  data: z.any(),
  meta: z.any(),
})

export type SharedDefaultResponse = z.infer<typeof SharedDefaultResponse>

export const SharedGetOneParams = z.object({
  id: z.string(),
})

export type SharedGetOneParams = z.infer<typeof SharedGetOneParams>
