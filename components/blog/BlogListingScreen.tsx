"use client"

import { useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { BlogCategoryNav } from "@/components/blog/BlogCategoryNav"
import { BlogPostCard } from "@/components/blog/BlogPostCard"

type BlogListingScreenProps = {
  posts: BlogPost[]
  categories: BlogCategory[]
  activeCategorySlug: string | null
  showDates?: boolean
}

export function BlogListingScreen({
  posts,
  categories,
  activeCategorySlug,
  showDates = true,
}: BlogListingScreenProps) {
  const { t } = useLocale()
  const categoryBySlug = useMemo(() => {
    const m = new Map<string, BlogCategory>()
    for (const c of categories) m.set(c.slug, c)
    return m
  }, [categories])

  return (
    <>
      <BlogCategoryNav categories={categories} activeSlug={activeCategorySlug} className="mb-10" />
      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
          {activeCategorySlug ? t.blog.emptyCategory : t.blog.emptyAll}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id} className="min-h-[1px]">
              <BlogPostCard
                post={post}
                category={categoryBySlug.get(post.category_slug)}
                showDates={showDates}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
