import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get("locale")
    const section = searchParams.get("section")

    const db = getDb()
    let query = "SELECT * FROM translations WHERE 1=1"
    const params: any[] = []

    if (locale) {
      query += " AND locale = ?"
      params.push(locale)
    }
    if (section) {
      query += " AND section = ?"
      params.push(section)
    }

    query += " ORDER BY locale, section, key"

    const translations = db.prepare(query).all(...params)

    return NextResponse.json(translations)
  } catch (error) {
    console.error("Get translations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const { locale, section, key, value } = await request.json()

    if (!locale || !section || !key) {
      return NextResponse.json({ error: "locale, section, and key are required" }, { status: 400 })
    }

    const db = getDb()
    const result = db
      .prepare("INSERT OR REPLACE INTO translations (locale, section, key, value) VALUES (?, ?, ?, ?)")
      .run(locale, section, key, value || "")

    return NextResponse.json({ id: result.lastInsertRowid, locale, section, key, value })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create translation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const { id, locale, section, key, value } = await request.json()

    if (!id || !locale || !section || !key) {
      return NextResponse.json({ error: "id, locale, section, and key are required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare("UPDATE translations SET locale = ?, section = ?, key = ?, value = ? WHERE id = ?").run(
      locale,
      section,
      key,
      value || "",
      id
    )

    return NextResponse.json({ id, locale, section, key, value })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update translation error:", error)
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
    db.prepare("DELETE FROM translations WHERE id = ?").run(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete translation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
