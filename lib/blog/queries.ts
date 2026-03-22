import { mockBlogCategories, mockBlogPosts } from "./mock-data"
import type { BlogCategory, BlogPost } from "./types"

function sortPostsNewestFirst(a: BlogPost, b: BlogPost): number {
  const pub = b.published_at.localeCompare(a.published_at)
  if (pub !== 0) return pub
  return b.created_at.localeCompare(a.created_at)
}

export function getBlogCategoriesSorted(): BlogCategory[] {
  return [...mockBlogCategories].sort((a, b) => a.order_index - b.order_index)
}

export function getPublishedPosts(): BlogPost[] {
  return [...mockBlogPosts].sort(sortPostsNewestFirst)
}

export function getCategoryBySlug(slug: string): BlogCategory | undefined {
  return mockBlogCategories.find((c) => c.slug === slug)
}

export function getPostsByCategorySlug(categorySlug: string): BlogPost[] {
  return getPublishedPosts().filter((p) => p.category_slug === categorySlug)
}

export function getPostBySlugs(categorySlug: string, postSlug: string): BlogPost | undefined {
  return mockBlogPosts.find((p) => p.category_slug === categorySlug && p.slug === postSlug)
}

export function getPostCanonicalPath(post: BlogPost): string {
  return `/blog/${post.category_slug}/${post.slug}`
}
