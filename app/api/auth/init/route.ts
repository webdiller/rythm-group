import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"
import { tableUsers } from "@/lib/db/schema"
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; password?: string }
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const db = getDb()
    const users = db.select().from(tableUsers).limit(1).all()
    if (users.length > 0) {
      return NextResponse.json({ error: "Users already exist. Use /api/auth/login instead." }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const [created] = db.insert(tableUsers).values({ username, password_hash: passwordHash }).returning().all()
    if (!created) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: created.id,
    })
  } catch (error) {
    console.error("Init user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
