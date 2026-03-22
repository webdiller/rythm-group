"use client"

import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { BlogPageBreadcrumbs } from "@/components/blog/BlogPageBreadcrumbs"
import { BlogArticleBody } from "@/components/blog/BlogArticleBody"

type BlogPostViewProps = {
  post: BlogPost
  category: BlogCategory
  showDates?: boolean
}

export function BlogPostView({ post, category, showDates = true }: BlogPostViewProps) {
  const { locale, t } = useLocale()
  const title = locale === "en" ? post.title_en : post.title_ru
  const body = locale === "en" ? post.body_html_en : post.body_html_ru
  const categoryLabel = locale === "en" ? category.name_en : category.name_ru
  const dateLocale = locale === "en" ? enUS : ru
  const formattedDate = showDates
    ? format(new Date(post.published_at), "d MMMM yyyy", { locale: dateLocale })
    : null

  return (
    <article>
      <BlogPageBreadcrumbs variant="post" category={category} postTitle={title} />

      <header className="mb-10 space-y-4 lg:space-y-5">
        <p className="text-sm font-medium text-primary">{categoryLabel}</p>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {formattedDate && (
          <p className="text-sm text-muted-foreground">
            <span className="text-muted-foreground/80">{t.blog.dateLabel}: </span>
            <time dateTime={post.published_at}>{formattedDate}</time>
          </p>
        )}
      </header>

      {post.cover_image_url ? (
        <figure className="mb-10 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm">
          <img
            src={post.cover_image_url}
            alt={title}
            className="aspect-video w-full object-cover sm:aspect-[21/9]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </figure>
      ) : null}

      <div className="max-w-4xl mx-auto w-full">
        <BlogArticleBody html={body} />
      </div>
    </article>
  )
}
