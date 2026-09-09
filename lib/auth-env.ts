/**
 * Admin users from env: ADMIN_USERS = "user1:pass1,user2:pass2"
 * Comma separates pairs; first colon in each pair separates username from password.
 */
const ADMIN_USERS_KEY = "ADMIN_USERS"

export interface EnvUser {
	username: string
	password: string
}

/** Parses ADMIN_USERS into list of { username, password }. Passwords may contain colons. */
export function getEnvAdminUsers(): EnvUser[] {
	const raw = process.env[ADMIN_USERS_KEY]
	if (!raw || typeof raw !== "string") return []
	const pairs = raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
	const result: EnvUser[] = []
	for (const pair of pairs) {
		const firstColon = pair.indexOf(":")
		if (firstColon === -1) continue
		const username = pair.slice(0, firstColon).trim()
		const password = pair.slice(firstColon + 1)
		if (username) result.push({ username, password })
	}
	return result
}

/** Returns { username, id } if credentials match an env user, null otherwise. id is -1 for env users. */
export function validateEnvAdminUser(username: string, password: string): { username: string; id: number } | null {
	const users = getEnvAdminUsers()
	const match = users.find((u) => u.username === username && u.password === password)
	if (!match) return null
	return { username: match.username, id: -1 }
}
