import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/auth"
import { ServiceUsers } from "@/lib/services/users"
import { LoginBody } from "@/lib/schemas/users"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = LoginBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Username and password are required", errors: parsed.error.flatten() }, { status: 400 })
    }

    const user = ServiceUsers.getByUsername(parsed.data.username)
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(parsed.data.password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken({ username: user.username, userId: user.id })

    return NextResponse.json({
      token,
      user: { username: user.username, id: user.id },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
