import { NextResponse } from "next/server"
import { getBlogCategoriesSorted } from "@/lib/blog/queries"

export const runtime = "nodejs"

export async function GET() {
	const categories = getBlogCategoriesSorted()
	return NextResponse.json({ data: categories, meta: null })
}
