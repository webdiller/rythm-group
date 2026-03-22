import { BlogListingHeader } from "@/components/blog/BlogListingHeader"
import { BlogListingScreen } from "@/components/blog/BlogListingScreen"
import { getBlogCategoriesSorted, getPublishedPosts } from "@/lib/blog/queries"

export default function BlogIndexPage() {
  const categories = getBlogCategoriesSorted()
  const posts = getPublishedPosts()

  return (
    <>
      <BlogListingHeader />
      <BlogListingScreen posts={posts} categories={categories} activeCategorySlug={null} />
    </>
  )
}
