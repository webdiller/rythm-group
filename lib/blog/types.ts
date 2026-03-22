/** Публичные типы блога (UI). Согласуются с будущей схемой БД из ТЗ, без привязки к Drizzle. */

export type BlogCategory = {
  id: string
  slug: string
  name_ru: string
  name_en: string
  order_index: number
}

export type BlogPost = {
  id: string
  category_slug: string
  slug: string
  title_ru: string
  title_en: string
  excerpt_ru: string
  excerpt_en: string
  /** Одна обложка поста (URL в S3/CDN после интеграции). */
  cover_image_url: string | null
  /** HTML контента (в продакшене — санитизировать перед выводом). */
  body_html_ru: string
  body_html_en: string
  published_at: string
  /** ISO created_at для сортировки при равной дате публикации (ТЗ 3.2). */
  created_at: string
}
