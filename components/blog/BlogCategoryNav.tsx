"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import type { BlogCategory } from "@/lib/blog/types"
import { cn } from "@/lib/utils"

type BlogCategoryNavProps = {
  categories: BlogCategory[]
  activeSlug: string | null
  className?: string
}

export function BlogCategoryNav({ categories, activeSlug, className }: BlogCategoryNavProps) {
  const { locale, t } = useLocale()

  const sorted = [...categories].sort((a, b) => a.order_index - b.order_index)

  return (
    <nav
      className={cn("flex flex-wrap gap-2", className)}
      aria-label={t.blog.title}
    >
      <Link
        href="/blog"
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
          activeSlug === null
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        {t.blog.allCategories}
      </Link>
      {sorted.map((cat) => {
        const label = locale === "en" ? cat.name_en : cat.name_ru
        const isActive = activeSlug === cat.slug
        return (
          <Link
            key={cat.id}
            href={`/blog/${cat.slug}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
