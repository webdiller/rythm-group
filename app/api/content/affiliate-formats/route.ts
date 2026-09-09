import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceAffiliateFormats } from "@/lib/services/affiliate-formats"
import { CreateOneBody, DeleteOneParams, UpdateOneBody } from "@/lib/schemas/affiliate-formats"

export async function GET() {
  const result = ServiceAffiliateFormats.getAll()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceAffiliateFormats.createOne(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create affiliate format error:", error)
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
    const result = ServiceAffiliateFormats.updateOne(parsed.data)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update affiliate format error:", error)
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
    return NextResponse.json(ServiceAffiliateFormats.deleteOne(parsed.data))
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete affiliate format error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
