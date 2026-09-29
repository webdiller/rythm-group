import { assertLocalSeedAllowed, isLocalSeedAllowed } from "@/lib/local-seed/guard"
import { buildLocalSeedPlan, seedFromLocalData } from "@/lib/local-seed/seed"
import type { LocalSeedDryRunResult, LocalSeedExecuteResult } from "@/lib/local-seed/types"

export async function dryRunLocalSeed(): Promise<LocalSeedDryRunResult> {
  const plan = buildLocalSeedPlan()
  const ready = plan.dataFileExists && plan.channelsInFile > 0
  return {
    dryRun: true,
    allowed: isLocalSeedAllowed(),
    plan,
    ready,
  }
}

export async function executeLocalSeed(): Promise<LocalSeedExecuteResult> {
  assertLocalSeedAllowed()
  const plan = buildLocalSeedPlan()
  if (!plan.dataFileExists || plan.channelsInFile === 0) {
    throw new Error("LOCAL_DATA_MISSING")
  }

  const { created, deletedChannelAvatars, deletedPartnerLogos, skippedAvatars } =
    await seedFromLocalData()

  return {
    dryRun: false,
    ok: true,
    deletedChannelAvatars,
    deletedPartnerLogos,
    created,
    skippedAvatars,
  }
}
