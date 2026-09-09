import { NextRequest, NextResponse } from "next/server"
import { getPublishedPosts } from "@/lib/blog/queries"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
	const categorySlug = request.nextUrl.searchParams.get("categorySlug")
	const posts = getPublishedPosts(categorySlug ?? undefined)
	return NextResponse.json({ data: posts, meta: null })
}
