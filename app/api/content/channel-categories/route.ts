import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const db = getDb()
  const categories = db.prepare("SELECT * FROM channel_categories ORDER BY order_index").all()
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { id, name_ru, name_en, order_index } = await request.json()

    if (!id || !name_ru || !name_en) {
      return NextResponse.json({ error: "id, name_ru, and name_en are required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("INSERT OR REPLACE INTO channel_categories (id, name_ru, name_en, order_index) VALUES (?, ?, ?, ?)").run(
      id,
      name_ru,
      name_en,
      order_index || 0
    )

    return NextResponse.json({ id, name_ru, name_en, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const { id, name_ru, name_en, order_index } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("UPDATE channel_categories SET name_ru = ?, name_en = ?, order_index = ? WHERE id = ?").run(
      name_ru,
      name_en,
      order_index || 0,
      id
    )

    return NextResponse.json({ id, name_ru, name_en, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
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

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("DELETE FROM channel_categories WHERE id = ?").run(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
