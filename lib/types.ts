import { z } from "zod"
import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod"
import { tableUsers, tableTranslations, tableChannelCategories, tableChannels, tablePartnerCategories, tablePartners, tableContacts, tableBlogCategories, tableBlogPosts, tableAffiliateHero, tableAffiliateFormats, tableAffiliateFaq, tableAffiliatePartnerViews, tableAboutCards } from "./db/schema"

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
  tablePartnerCategories: {
    select: createSelectSchema(tablePartnerCategories),
    insert: createInsertSchema(tablePartnerCategories),
    update: createUpdateSchema(tablePartnerCategories),
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
  tableBlogCategories: {
    select: createSelectSchema(tableBlogCategories),
    insert: createInsertSchema(tableBlogCategories),
    update: createUpdateSchema(tableBlogCategories),
  },
  tableBlogPosts: {
    select: createSelectSchema(tableBlogPosts),
    insert: createInsertSchema(tableBlogPosts),
    update: createUpdateSchema(tableBlogPosts),
  },
  tableAffiliateHero: {
    select: createSelectSchema(tableAffiliateHero),
    insert: createInsertSchema(tableAffiliateHero),
    update: createUpdateSchema(tableAffiliateHero),
  },
  tableAffiliateFormats: {
    select: createSelectSchema(tableAffiliateFormats),
    insert: createInsertSchema(tableAffiliateFormats),
    update: createUpdateSchema(tableAffiliateFormats),
  },
  tableAffiliateFaq: {
    select: createSelectSchema(tableAffiliateFaq),
    insert: createInsertSchema(tableAffiliateFaq),
    update: createUpdateSchema(tableAffiliateFaq),
  },
  tableAffiliatePartnerViews: {
    select: createSelectSchema(tableAffiliatePartnerViews),
    insert: createInsertSchema(tableAffiliatePartnerViews),
    update: createUpdateSchema(tableAffiliatePartnerViews),
  },
  tableAboutCards: {
    select: createSelectSchema(tableAboutCards),
    insert: createInsertSchema(tableAboutCards),
    update: createUpdateSchema(tableAboutCards),
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
