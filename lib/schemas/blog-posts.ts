import { z } from "zod"
import { SharedDefaultResponse } from "@/lib/types"
import { KEBAB_SLUG_REGEX } from "@/lib/blog/slug"

const kebabSlug = z.string().regex(KEBAB_SLUG_REGEX, "slug: латиница, kebab-case")

/** Абсолютный URL (http/https), путь `/uploads/...`, или S3 key `blog/images/...`. */
const coverImageUrl = z.union([
  z.string().url(),
  z.string().regex(/^\/[^?\s]+$/, "Invalid url"),
  z.string().regex(/^blog\/images\/[\w.-]+$/, "Invalid blog cover key"),
  z.literal(""),
  z.null(),
])

export const PostStatus = z.enum(["draft", "published"])

export const CreatePostBody = z.object({
  category_id: z.number().int().positive(),
  slug: kebabSlug,
  title_ru: z.string().min(1),
  title_en: z.string().min(1),
  excerpt_ru: z.string().min(1),
  excerpt_en: z.string().min(1),
  body_html_ru: z.string(),
  body_html_en: z.string(),
  cover_image_url: coverImageUrl
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  status: PostStatus,
  /** Unix seconds; по умолчанию — now на сервере */
  published_at: z.number().int().optional(),
})

export const PatchPostBody = z
  .object({
    category_id: z.number().int().positive().optional(),
    slug: kebabSlug.optional(),
    title_ru: z.string().min(1).optional(),
    title_en: z.string().min(1).optional(),
    excerpt_ru: z.string().min(1).optional(),
    excerpt_en: z.string().min(1).optional(),
    body_html_ru: z.string().optional(),
    body_html_en: z.string().optional(),
    cover_image_url: coverImageUrl
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    status: PostStatus.optional(),
    /** Unix seconds — только если нужно вручную; иначе при публикации ставится now */
    published_at: z.number().int().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "empty patch" })

export const AdminPostRow = z.object({
  id: z.number(),
  category_id: z.number(),
  slug: z.string(),
  title_ru: z.string(),
  title_en: z.string(),
  excerpt_ru: z.string(),
  excerpt_en: z.string(),
  body_html_ru: z.string(),
  body_html_en: z.string(),
  cover_image_url: z.string().nullable(),
  status: PostStatus,
  published_at: z.number(),
  deleted_at: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  category_slug: z.string().optional(),
})

export const PostsListResponse = SharedDefaultResponse.extend({
  data: z.array(AdminPostRow),
})

export type CreatePostBody = z.infer<typeof CreatePostBody>
export type PatchPostBody = z.infer<typeof PatchPostBody>
