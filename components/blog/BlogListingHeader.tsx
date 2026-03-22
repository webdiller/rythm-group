"use client"

import { useLocale } from "@/lib/locale-context"
import type { BlogCategory } from "@/lib/blog/types"
import { BlogPageBreadcrumbs } from "@/components/blog/BlogPageBreadcrumbs"

type BlogListingHeaderProps = {
  category?: BlogCategory | null
}

export function BlogListingHeader({ category }: BlogListingHeaderProps) {
  const { locale, t } = useLocale()

  if (category) {
    const title = locale === "en" ? category.name_en : category.name_ru
    return (
      <header className="mb-8 space-y-4 lg:mb-10 lg:space-y-5">
        <BlogPageBreadcrumbs variant="category" category={category} />
        <div className="space-y-3">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </div>
      </header>
    )
  }

  return (
    <header className="mb-8 space-y-4 lg:mb-10 lg:space-y-5">
      <BlogPageBreadcrumbs variant="index" />
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t.blog.title}
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t.blog.subtitle}</p>
      </div>
    </header>
  )
}
