/**
 * Client-safe helpers: сборка публичного URL без @aws-sdk / server-only.
 */

export function normalizePublicBase(base: string): string {
  return base.replace(/\/$/, "")
}

export function getPublicObjectUrlFromBase(base: string, key: string): string {
  const normalizedBase = normalizePublicBase(base)
  const normalizedKey = key.replace(/^\//, "")
  return `${normalizedBase}/${normalizedKey}`
}

/** Публичный префикс бакета для браузера (`NEXT_PUBLIC_YA_PUBLIC_BASE`). */
export function getNextPublicYaPublicBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_YA_PUBLIC_BASE?.trim()
  if (!raw) return null
  return normalizePublicBase(raw)
}
