import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-key-in-production"

export interface JWTPayload {
	username: string
	userId: number
}

export function generateToken(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
		return decoded
	} catch (error) {
		return null
	}
}

export function getTokenFromRequest(request: NextRequest): string | null {
	// Check Authorization header first
	const authHeader = request.headers.get("authorization")
	if (authHeader && authHeader.startsWith("Bearer ")) {
		return authHeader.substring(7)
	}
	// Fallback to cookie
	const token = request.cookies.get("auth_token")?.value
	if (token) {
		return token
	}
	return null
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
	const token = getTokenFromRequest(request)
	if (!token) {
		return null
	}
	return verifyToken(token)
}

export function requireAuth(request: NextRequest): JWTPayload {
	const user = getAuthUser(request)
	if (!user) {
		throw new Error("Unauthorized")
	}
	return user
}
