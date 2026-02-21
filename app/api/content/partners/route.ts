import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const db = getDb()
  const partners = db.prepare("SELECT * FROM partners ORDER BY order_index").all()
  return NextResponse.json(partners)
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { name, name_short, order_index } = await request.json()

    if (!name || !name_short) {
      return NextResponse.json({ error: "name and name_short are required" }, { status: 400 })
    }

    const db = getDb()
    const result = db.prepare("INSERT INTO partners (name, name_short, order_index) VALUES (?, ?, ?)").run(
      name,
      name_short,
      order_index || 0
    )

    return NextResponse.json({ id: Number(result.lastInsertRowid), name, name_short, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create partner error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const { id, name, name_short, order_index } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("UPDATE partners SET name = ?, name_short = ?, order_index = ? WHERE id = ?").run(
      name,
      name_short,
      order_index || 0,
      id
    )

    return NextResponse.json({ id, name, name_short, order_index })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update partner error:", error)
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
    db.prepare("DELETE FROM partners WHERE id = ?").run(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete partner error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
