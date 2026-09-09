/**
 * Client-safe: JSON-массив id каналов («Наши каналы») для кейса.
 */
export function parseRelatedChannelIds(raw: string | null | undefined): number[] {
	if (!raw?.trim()) return []
	try {
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		const out: number[] = []
		const seen = new Set<number>()
		for (const item of parsed) {
			const id = typeof item === "number" ? item : Number(item)
			if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue
			seen.add(id)
			out.push(id)
		}
		return out
	} catch {
		return []
	}
}

export function serializeRelatedChannelIds(ids: number[]): string {
	const seen = new Set<number>()
	const out: number[] = []
	for (const id of ids) {
		if (!Number.isInteger(id) || id <= 0 || seen.has(id)) continue
		seen.add(id)
		out.push(id)
	}
	return JSON.stringify(out)
}
