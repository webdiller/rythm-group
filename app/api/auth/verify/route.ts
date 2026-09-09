import { NextRequest, NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
	try {
		const user = getAuthUser(request)

		if (!user) {
			return NextResponse.json({ valid: false }, { status: 401 })
		}

		return NextResponse.json({ valid: true, user })
	} catch (error) {
		return NextResponse.json({ valid: false }, { status: 401 })
	}
}
