import { assertDemoSeedAllowed, isDemoSeedAllowed } from "@/lib/demo-seed/guard"
import { integrityAllOk, runIntegrityChecks } from "@/lib/demo-seed/integrity"
import { collectAllS3KeysToDelete, deleteS3Keys, estimateS3KeysToDelete } from "@/lib/demo-seed/s3-cleanup"
import { plannedCreateCounts, seedDemoContent } from "@/lib/demo-seed/seed"
import type { DemoSeedDryRunResult, DemoSeedExecuteResult } from "@/lib/demo-seed/types"
import { snapshotTableCounts, wipeCmsDataKeepLogo } from "@/lib/demo-seed/wipe"

export async function dryRunDemoSeed(): Promise<DemoSeedDryRunResult> {
  const integrity = await runIntegrityChecks()
  const integrityOk = integrityAllOk(integrity)
  const willDeleteTables = snapshotTableCounts()
  let willDeleteS3KeysEstimate = 0
  try {
    willDeleteS3KeysEstimate = await estimateS3KeysToDelete()
  } catch {
    willDeleteS3KeysEstimate = -1
  }

  const settingsRow = willDeleteTables.find((t) => t.table === "site_settings")
  const willKeepLogo = (settingsRow?.rows ?? 0) > 0 // exact logo presence checked on execute

  return {
    dryRun: true,
    allowed: isDemoSeedAllowed(),
    integrity,
    integrityOk,
    plan: {
      willDeleteTables,
      willDeleteS3KeysEstimate,
      willKeepLogo,
      willCreate: plannedCreateCounts(),
    },
  }
}

export async function executeDemoSeed(): Promise<DemoSeedExecuteResult> {
  assertDemoSeedAllowed()

  const integrity = await runIntegrityChecks()
  if (!integrityAllOk(integrity)) {
    const failed = integrity.filter((c) => !c.ok).map((c) => c.message)
    throw new Error(`INTEGRITY_FAILED: ${failed.join("; ")}`)
  }

  const keys = await collectAllS3KeysToDelete()
  const deletedS3Keys = await deleteS3Keys(keys)
  const { keptLogo } = wipeCmsDataKeepLogo()
  const created = await seedDemoContent()

  return {
    dryRun: false,
    ok: true,
    deletedS3Keys,
    created,
    keptLogo,
  }
}
