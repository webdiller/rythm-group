/** Публичный URL страницы «Вишлисты» (бывший /affiliate). */
export const WISHLISTS_BASE_PATH = "/wishlists"

export function wishlistsCasePath(slug: string): string {
  return `${WISHLISTS_BASE_PATH}/cases/${slug}`
}

export function wishlistsSectionHref(sectionId: string): string {
  return `${WISHLISTS_BASE_PATH}#${sectionId}`
}
