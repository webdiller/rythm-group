import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { BlogListingHeader } from "@/components/blog/BlogListingHeader"
import { BlogListingScreen } from "@/components/blog/BlogListingScreen"
import { getBlogCategoriesSorted, getCategoryBySlug, getPostsByCategorySlug } from "@/lib/blog/queries"
import { mockBlogCategories } from "@/lib/blog/mock-data"

type PageProps = {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return mockBlogCategories.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const cat = getCategoryBySlug(slug)
  if (!cat) return { title: "Блог | Rythm Group" }
  return {
    title: `${cat.name_ru} | Блог — Rythm Group`,
    description: `Материалы категории «${cat.name_ru}» / ${cat.name_en} category posts.`,
  }
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const categories = getBlogCategoriesSorted()
  const posts = getPostsByCategorySlug(slug)

  return (
    <>
      <BlogListingHeader category={category} />
      <BlogListingScreen posts={posts} categories={categories} activeCategorySlug={slug} />
    </>
  )
}
