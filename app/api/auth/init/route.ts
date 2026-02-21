import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDb } from "@/lib/db"

// This route creates the first admin user if no users exist
// Should be called once during initial setup
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const db = getDb()
    
    // Check if any users exist
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
    
    if (userCount.count > 0) {
      return NextResponse.json({ error: "Users already exist. Use /api/auth/login instead." }, { status: 400 })
    }

    // Create first admin user
    const passwordHash = await bcrypt.hash(password, 10)
    const result = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, passwordHash)

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: result.lastInsertRowid,
    })
  } catch (error) {
    console.error("Init user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
