import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceContacts } from "@/lib/services/contacts"
import { CreateOneBody, UpdateOneBody, DeleteOneParams } from "@/lib/schemas/contacts"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const context = searchParams.get("context")
  if (context === "landing" || context === "affiliate") {
    const row = ServiceContacts.getByContext(context)
    return NextResponse.json({ data: row, meta: null })
  }
  const id = searchParams.get("id")
  if (id) {
    const result = ServiceContacts.getOne({ id })
    return NextResponse.json(result.data != null ? { data: result.data, meta: null } : { data: null, meta: null })
  }
  const result = ServiceContacts.getAll()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "email and telegram_url are required", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceContacts.createOne(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = UpdateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "id is required", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceContacts.updateOne({ id: String(parsed.data.id) }, parsed.data)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const parsed = DeleteOneParams.safeParse({ id: id ?? "" })
    if (!parsed.success) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    ServiceContacts.deleteOne(parsed.data)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete contact error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
