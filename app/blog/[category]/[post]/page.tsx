import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BlogPostView } from "@/components/blog/BlogPostView"
import { getBlogShowDatesEnabled, getCategoryBySlug, getPostBySlugs } from "@/lib/blog/queries"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ category: string; post: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: catSlug, post: postSlug } = await params
  const post = getPostBySlugs(catSlug, postSlug)
  if (!post) return { title: "Запись не найдена | Rythm Group" }
  const ogImage = post.cover_image_url ? [{ url: post.cover_image_url }] : undefined

  return {
    title: `${post.title_ru} | Блог — Rythm Group`,
    description: post.excerpt_ru,
    openGraph: {
      title: post.title_ru,
      description: post.excerpt_ru,
      type: "article",
      images: ogImage,
    },
    ...(post.cover_image_url
      ? {
          twitter: {
            card: "summary_large_image" as const,
            images: [post.cover_image_url],
          },
        }
      : {}),
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { category: catSlug, post: postSlug } = await params
  const { pageBlogEnabled } = getPageVisibilityFlags()
  if (!pageBlogEnabled) notFound()

  const post = getPostBySlugs(catSlug, postSlug)
  const category = getCategoryBySlug(catSlug)
  if (!post || !category) notFound()

  const showDates = getBlogShowDatesEnabled()

  return (
    <BlogPostView
      post={post}
      category={category}
      showDates={showDates}
    />
  )
}
