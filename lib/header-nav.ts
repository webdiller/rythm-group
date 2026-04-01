export const DEFAULT_HEADER_NAV_ORDER = [
  "about",
  "channels",
  "cases",
  "affiliate",
  "blog",
  "contacts",
] as const

export type HeaderNavItemId = (typeof DEFAULT_HEADER_NAV_ORDER)[number]

const NAV_ID_SET = new Set<string>(DEFAULT_HEADER_NAV_ORDER)

export function normalizeHeaderNavOrder(input: unknown): HeaderNavItemId[] {
  if (!Array.isArray(input)) return [...DEFAULT_HEADER_NAV_ORDER]

  const fromInput: HeaderNavItemId[] = []
  for (const value of input) {
    if (typeof value !== "string") continue
    if (!NAV_ID_SET.has(value)) continue
    if (fromInput.includes(value as HeaderNavItemId)) continue
    fromInput.push(value as HeaderNavItemId)
  }

  for (const id of DEFAULT_HEADER_NAV_ORDER) {
    if (!fromInput.includes(id)) fromInput.push(id)
  }

  return fromInput
}
