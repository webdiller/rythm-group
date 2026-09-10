/** Демо-сид разрешён только при явном флаге (защита прода). */
export function isDemoSeedAllowed(): boolean {
  const raw = process.env.ALLOW_DEMO_SEED?.trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes"
}

export function assertDemoSeedAllowed(): void {
  if (!isDemoSeedAllowed()) {
    throw new Error("DEMO_SEED_DISABLED")
  }
}
