import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { promises as fs } from "node:fs"
import { requireAuth } from "@/lib/auth"
import { type BackgroundKind, resolveBackgroundSlot, uploadBackgroundWebp } from "@/lib/s3/backgrounds"
import { clearBackgroundKey, legacyBackgroundDiskPath, replaceBackgroundKey } from "@/lib/server/site-backgrounds"

type ProcessOptions = {
	kind: BackgroundKind
	orientationError: string
	requireLandscape: boolean
	resize: { width: number; height: number }
}

/** Только upload/delete (auth). Отдача — public S3 URL или static `/backgrounds/*.webp`. */
export function createBackgroundRouteHandlers(options: ProcessOptions) {
	const { kind, orientationError, requireLandscape, resize } = options

	async function POST(request: NextRequest) {
		try {
			requireAuth(request)

			const { searchParams } = new URL(request.url)
			const theme = searchParams.get("theme")
			const scope = searchParams.get("scope")
			const slot = resolveBackgroundSlot(kind, theme, scope)

			const formData = await request.formData()
			const file = formData.get("file")

			if (!file || !(file instanceof Blob)) {
				return NextResponse.json({ error: "file is required" }, { status: 400 })
			}

			const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
			const fileType = (file as File).type || ""
			if (!allowedTypes.includes(fileType)) {
				return NextResponse.json({ error: "Допустимые форматы файлов: JPG, PNG, WebP" }, { status: 400 })
			}

			const maxSizeBytes = 5 * 1024 * 1024
			if (file.size > maxSizeBytes) {
				return NextResponse.json({ error: "Файл не должен превышать 5 МБ" }, { status: 400 })
			}

			const inputBuffer = Buffer.from(await file.arrayBuffer())
			const image = sharp(inputBuffer)
			const metadata = await image.metadata()

			if (metadata.width && metadata.height) {
				if (requireLandscape && metadata.width < metadata.height) {
					return NextResponse.json({ error: orientationError }, { status: 400 })
				}
				if (!requireLandscape && metadata.height < metadata.width) {
					return NextResponse.json({ error: orientationError }, { status: 400 })
				}
			}

			const optimizedBuffer = await image.resize(resize.width, resize.height, { fit: "cover" }).webp({ quality: 80 }).toBuffer()

			const key = await uploadBackgroundWebp(slot, optimizedBuffer)
			await replaceBackgroundKey(slot, key)

			try {
				await fs.unlink(legacyBackgroundDiskPath(slot))
			} catch {
				// ignore missing legacy file
			}

			return NextResponse.json({ success: true, key })
		} catch (error: unknown) {
			console.error(`Upload ${kind} background error:`, error)
			if (error instanceof Error && error.message === "Unauthorized") {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
			}
			return NextResponse.json({ error: "Internal server error" }, { status: 500 })
		}
	}

	async function DELETE(request: NextRequest) {
		try {
			requireAuth(request)

			const { searchParams } = new URL(request.url)
			const theme = searchParams.get("theme")
			const scope = searchParams.get("scope")
			const slot = resolveBackgroundSlot(kind, theme, scope)

			await clearBackgroundKey(slot)

			try {
				await fs.unlink(legacyBackgroundDiskPath(slot))
			} catch {
				// ignore
			}

			return NextResponse.json({ success: true })
		} catch (error: unknown) {
			console.error(`Delete ${kind} background error:`, error)
			if (error instanceof Error && error.message === "Unauthorized") {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
			}
			return NextResponse.json({ error: "Internal server error" }, { status: 500 })
		}
	}

	return { POST, DELETE }
}
