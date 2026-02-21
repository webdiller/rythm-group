import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceChannels } from "@/lib/services/channels"
import {
  CreateOneBody,
  UpdateOneBody,
  DeleteOneParams,
} from "@/lib/schemas/channels"

export async function GET() {
  const result = ServiceChannels.getAll()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "category_id, name, subscribers, and url are required", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceChannels.createOne(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create channel error:", error)
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
    const result = ServiceChannels.updateOne({ id: String(parsed.data.id) }, parsed.data)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update channel error:", error)
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
    ServiceChannels.deleteOne(parsed.data)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
