import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BlogPostView } from "@/components/blog/BlogPostView"
import { getCategoryBySlug, getPostBySlugs } from "@/lib/blog/queries"
import { mockBlogPosts } from "@/lib/blog/mock-data"

type PageProps = {
  params: Promise<{ category: string; post: string }>
}

export function generateStaticParams() {
  return mockBlogPosts.map((p) => ({
    category: p.category_slug,
    post: p.slug,
  }))
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
  const post = getPostBySlugs(catSlug, postSlug)
  const category = getCategoryBySlug(catSlug)
  if (!post || !category) notFound()

  return <BlogPostView post={post} category={category} />
}
