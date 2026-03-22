/** Латиница kebab-case для URL (категории и посты). */
export const KEBAB_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isKebabSlug(s: string): boolean {
  return KEBAB_SLUG_REGEX.test(s)
}

/** Транслитерация кириллицы (рус.) в латиницу для slug. */
const RU_TO_LAT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
}

/** Строит kebab-case slug из русского заголовка (для админки). */
export function slugifyRuTitle(title: string): string {
  const lower = title.toLowerCase().trim()
  let buf = ""
  for (const ch of lower) {
    buf += RU_TO_LAT[ch] ?? ch
  }
  return buf
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
