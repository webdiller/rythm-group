import { notFound } from "next/navigation"
import { BlogPostFormPage } from "@/components/dashboard/blog/blog-post-form-page"

type PageProps = {
	params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: PageProps) {
	const { id } = await params
	const n = Number(id)
	if (Number.isNaN(n) || n < 1) {
		notFound()
	}
	return <BlogPostFormPage postId={n} />
}
