import { z } from "zod"

export const LOCAL_SEED_CONFIRM_PHRASE = "IMPORT"

export const LocalSeedExecuteBody = z.object({
  confirm: z.literal(LOCAL_SEED_CONFIRM_PHRASE),
})

export type LocalSeedPlan = {
  dataFile: string
  avatarsDir: string
  dataFileExists: boolean
  channelsInFile: number
  partnersInFile: number
  avatarsFound: number
  avatarsMissing: string[]
  willReplace: {
    channels: number
    partners: number
    about_cards: number
    affiliate_formats: number
    affiliate_faq: number
    translation_keys: number
  }
}

export type LocalSeedDryRunResult = {
  dryRun: true
  allowed: boolean
  plan: LocalSeedPlan
  ready: boolean
}

export type LocalSeedExecuteResult = {
  dryRun: false
  ok: true
  deletedChannelAvatars: number
  deletedPartnerLogos: number
  created: Record<string, number>
  skippedAvatars: string[]
}
