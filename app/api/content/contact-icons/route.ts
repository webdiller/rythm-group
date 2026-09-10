import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceContactIcons } from "@/lib/services/contact-icons"
import { UpdateOneBody } from "@/lib/schemas/contact-icons"

export const runtime = "nodejs"

/** Публичный список (для формы контактов и админки). */
export async function GET() {
  try {
    const result = ServiceContactIcons.getAll()
    return NextResponse.json(result)
  } catch (error) {
    console.error("List contact icons error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = UpdateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", errors: parsed.error.flatten() }, { status: 400 })
    }
    const data = ServiceContactIcons.updateOne(parsed.data)
    return NextResponse.json({ data, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Contact icon not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.error("Update contact icon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    await ServiceContactIcons.deleteOne(id)
    return NextResponse.json({ data: true, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "ICON_IN_USE") {
      return NextResponse.json(
        {
          error: "ICON_IN_USE",
          message: "Иконка используется в контактах. Сначала снимите её с прямых ссылок.",
        },
        { status: 409 },
      )
    }
    if (error instanceof Error && error.message === "Contact icon not found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    console.error("Delete contact icon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
