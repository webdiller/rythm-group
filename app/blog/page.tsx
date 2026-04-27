import { notFound } from "next/navigation"
import { BlogListingHeader } from "@/components/blog/BlogListingHeader"
import { BlogListingScreen } from "@/components/blog/BlogListingScreen"
import { getBlogCategoriesSorted, getBlogShowDatesEnabled, getPublishedPosts } from "@/lib/blog/queries"
import { getPageVisibilityFlags } from "@/lib/db/page-visibility"

export const dynamic = "force-dynamic"

export default function BlogIndexPage() {
  const { pageBlogEnabled } = getPageVisibilityFlags()
  if (!pageBlogEnabled) notFound()
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
