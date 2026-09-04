"use client"

import Link from "next/link"
import { useLocale } from "@/lib/locale-context"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { BlogPostCard } from "@/components/blog/BlogPostCard"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"

type LandingBlogSectionProps = {
  posts: BlogPost[]
  categories: BlogCategory[]
  showDates: boolean
  animationsEnabled?: boolean
}

function categoryBySlug(categories: BlogCategory[], slug: string): BlogCategory | undefined {
  return categories.find((c) => c.slug === slug)
}

export function LandingBlogSection({
  posts,
  categories,
  showDates,
  animationsEnabled = true,
}: LandingBlogSectionProps) {
  const { t } = useLocale()

  if (posts.length === 0) return null
  return (
    <section id="blog" className="relative px-6 py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-0 top-1/4 h-[420px] w-[520px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
                {t.blog.title}
              </h2>
              <p className="text-base text-muted-foreground md:text-lg text-pretty">{t.blog.subtitle}</p>
            </div>
            <Link
              href="/blog"
              className="inline-flex shrink-0 justify-center rounded-lg border border-border bg-secondary/50 px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary md:self-end"
            >
              {t.blog.backToBlog}
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post, i) => (
            <ScrollStagger key={post.id} index={i} delayStep={80} disabled={!animationsEnabled}>
              <BlogPostCard
                post={post}
                category={categoryBySlug(categories, post.category_slug)}
                showDates={showDates}
              />
            </ScrollStagger>
          ))}
        </div>
      </div>
    </section>
  )
}
