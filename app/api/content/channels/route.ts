import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const db = getDb()
  const channels = db
    .prepare(
      `
    SELECT c.*, cc.name_ru as category_name_ru, cc.name_en as category_name_en
    FROM channels c
    JOIN channel_categories cc ON c.category_id = cc.id
    ORDER BY c.category_id, c.order_index
  `
    )
    .all()

  return NextResponse.json(channels)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { category_id, name, subscribers, url, order_index } = await request.json()

    if (!category_id || !name || !subscribers || !url) {
      return NextResponse.json({ error: "category_id, name, subscribers, and url are required" }, { status: 400 })
    }

    const db = getDb()
    const result = db
      .prepare("INSERT INTO channels (category_id, name, subscribers, url, order_index) VALUES (?, ?, ?, ?, ?)")
      .run(category_id, name, subscribers, url, order_index || 0)

    return NextResponse.json({ id: Number(result.lastInsertRowid), category_id, name, subscribers, url, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const { id, category_id, name, subscribers, url, order_index } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare(
      "UPDATE channels SET category_id = ?, name = ?, subscribers = ?, url = ?, order_index = ? WHERE id = ?"
    ).run(category_id, name, subscribers, url, order_index || 0, id)

    return NextResponse.json({ id, category_id, name, subscribers, url, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
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

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("DELETE FROM channels WHERE id = ?").run(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete channel error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
