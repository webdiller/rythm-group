import { BlogListingHeader } from "@/components/blog/BlogListingHeader"
import { BlogListingScreen } from "@/components/blog/BlogListingScreen"
import { getBlogCategoriesSorted, getBlogShowDatesEnabled, getPublishedPosts } from "@/lib/blog/queries"

export const dynamic = "force-dynamic"

export default function BlogIndexPage() {
  const categories = getBlogCategoriesSorted()
  const posts = getPublishedPosts()
  const showDates = getBlogShowDatesEnabled()

  return (
    <>
      <BlogListingHeader />
      <BlogListingScreen
        posts={posts}
        categories={categories}
        activeCategorySlug={null}
        showDates={showDates}
      />
    </>
  )
}
