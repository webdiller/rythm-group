/** Локальный импорт разрешён при том же флаге, что и демо-сид. */
export function isLocalSeedAllowed(): boolean {
  const raw = process.env.ALLOW_DEMO_SEED?.trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes"
}

export function assertLocalSeedAllowed(): void {
  if (!isLocalSeedAllowed()) {
    throw new Error("LOCAL_SEED_DISABLED")
  }
}
