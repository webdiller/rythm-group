/** Латиница kebab-case для URL (категории и посты). */
export const KEBAB_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isKebabSlug(s: string): boolean {
  return KEBAB_SLUG_REGEX.test(s)
}
