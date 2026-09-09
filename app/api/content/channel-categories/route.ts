import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { ServiceChannelCategories } from "@/lib/services/channel-categories"
import { CreateOneBody, UpdateOneBody, UpdateOneParams, DeleteOneParams } from "@/lib/schemas/channel-categories"

export async function GET() {
  const result = ServiceChannelCategories.getAll()
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json()
    const parsed = CreateOneBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "id, name_ru, and name_en are required", errors: parsed.error.flatten() }, { status: 400 })
    }
    const result = ServiceChannelCategories.createOne(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const body = (await request.json()) as {
      id?: string
      name_ru?: string
      name_en?: string
      order_index?: number
    }
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const paramsParsed = UpdateOneParams.safeParse({ id: body.id })
    const bodyParsed = UpdateOneBody.safeParse(body)
    if (!paramsParsed.success || !bodyParsed.success) {
      return NextResponse.json({ errors: (paramsParsed.success ? bodyParsed.error : paramsParsed.error)?.flatten() }, { status: 400 })
    }
    const result = ServiceChannelCategories.updateOne(paramsParsed.data, bodyParsed.data)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update category error:", error)
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
    ServiceChannelCategories.deleteOne(parsed.data)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
