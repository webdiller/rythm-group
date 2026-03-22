import { NextRequest, NextResponse } from "next/server"
import { getPostBySlugs } from "@/lib/blog/queries"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("categorySlug")
  const postSlug = request.nextUrl.searchParams.get("postSlug")
  if (!categorySlug || !postSlug) {
    return NextResponse.json({ error: "categorySlug and postSlug required" }, { status: 400 })
  }
  const post = getPostBySlugs(categorySlug, postSlug)
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ data: post, meta: null })
}
