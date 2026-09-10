import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceContactIcons } from "@/lib/services/contact-icons"
import { ReorderBody } from "@/lib/schemas/contact-icons"

export const runtime = "nodejs"

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = ReorderBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", errors: parsed.error.flatten() }, { status: 400 })
    }
    const data = ServiceContactIcons.reorder(parsed.data.ids)
    return NextResponse.json({ data, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message.startsWith("Contact icon not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("Reorder contact icons error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
