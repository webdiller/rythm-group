import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(request: NextRequest) {
  const db = getDb()
  const contact = db.prepare("SELECT * FROM contacts WHERE id = 1").get()
  return NextResponse.json(contact || { email: "", telegram_url: "", telegram_username: "" })
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)
    const { email, telegram_url, telegram_username } = await request.json()

    if (!email || !telegram_url) {
      return NextResponse.json({ error: "email and telegram_url are required" }, { status: 400 })
    }

    const db = getDb()
    db.prepare(
      "INSERT OR REPLACE INTO contacts (id, email, telegram_url, telegram_username) VALUES (1, ?, ?, ?)"
    ).run(email, telegram_url, telegram_username || "")

    return NextResponse.json({ id: 1, email, telegram_url, telegram_username })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Update contacts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
