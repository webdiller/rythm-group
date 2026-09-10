import { z } from "zod"

export const DEMO_SEED_CONFIRM_PHRASE = "RESET"

export const DemoSeedExecuteBody = z.object({
  confirm: z.literal(DEMO_SEED_CONFIRM_PHRASE),
})

export type IntegrityCheck = {
  id: string
  ok: boolean
  message: string
}

export type TableCount = {
  table: string
  rows: number
}

export type DemoSeedPlan = {
  willDeleteTables: TableCount[]
  willDeleteS3KeysEstimate: number
  willKeepLogo: boolean
  willCreate: Record<string, number>
}

export type DemoSeedDryRunResult = {
  dryRun: true
  allowed: boolean
  integrity: IntegrityCheck[]
  integrityOk: boolean
  plan: DemoSeedPlan
}

export type DemoSeedExecuteResult = {
  dryRun: false
  ok: true
  deletedS3Keys: number
  created: Record<string, number>
  keptLogo: boolean
}
