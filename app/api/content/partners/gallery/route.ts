import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tablePartners } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { deletePartnerGalleryImageObjects, parsePartnerCaseGalleryJson, serializePartnerCaseGallery, uploadPartnerGalleryImage, type PartnerCaseGalleryImage } from "@/lib/s3/partner-gallery"

export const runtime = "nodejs"

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

function readGallery(partnerId: number): {
	row: typeof tablePartners.$inferSelect
	images: PartnerCaseGalleryImage[]
} | null {
	const db = getDb()
	const row = db.select().from(tablePartners).where(eq(tablePartners.id, partnerId)).get()
	if (!row) return null
	return { row, images: parsePartnerCaseGalleryJson(row.case_gallery) }
}

function writeGallery(partnerId: number, images: PartnerCaseGalleryImage[]) {
	const db = getDb()
	const [updated] = db
		.update(tablePartners)
		.set({ case_gallery: serializePartnerCaseGallery(images) })
		.where(eq(tablePartners.id, partnerId))
		.returning()
		.all()
	return updated ?? null
}

/** POST: загрузка одного или нескольких изображений в галерею кейса. */
export async function POST(request: NextRequest) {
	const uploaded: PartnerCaseGalleryImage[] = []
	try {
		requireAuth(request)
		const formData = await request.formData()
		const files = formData.getAll("file").filter((entry): entry is File => entry instanceof File && entry.size > 0)
		const partnerIdRaw = formData.get("partnerId")

		if (files.length === 0) {
			return NextResponse.json({ error: "file is required" }, { status: 400 })
		}
		if (!partnerIdRaw) {
			return NextResponse.json({ error: "partnerId is required" }, { status: 400 })
		}
		const partnerId = Number(partnerIdRaw)
		if (Number.isNaN(partnerId)) {
			return NextResponse.json({ error: "partnerId must be a number" }, { status: 400 })
		}

		for (const file of files) {
			const mime = file.type || "application/octet-stream"
			if (!ALLOWED_MIMES.has(mime)) {
				return NextResponse.json({ error: "Allowed: jpg, png, webp, gif" }, { status: 400 })
			}
			if (file.size > MAX_UPLOAD_BYTES) {
				return NextResponse.json({ error: "File size must not exceed 15MB" }, { status: 400 })
			}
		}

		const existing = readGallery(partnerId)
		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}

		for (const file of files) {
			const inputBuffer = Buffer.from(await file.arrayBuffer())
			const image = await uploadPartnerGalleryImage(partnerId, inputBuffer)
			uploaded.push(image)
		}

		const nextImages = [...existing.images, ...uploaded]
		const updated = writeGallery(partnerId, nextImages)
		if (!updated) {
			await Promise.all(uploaded.map((image) => deletePartnerGalleryImageObjects(image)))
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}

		return NextResponse.json({
			data: {
				partner: updated,
				image: uploaded[uploaded.length - 1] ?? null,
				images: nextImages,
				uploaded,
			},
			meta: null,
		})
	} catch (error: unknown) {
		if (uploaded.length > 0) {
			await Promise.all(uploaded.map((image) => deletePartnerGalleryImageObjects(image))).catch(() => undefined)
		}
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Upload partner gallery image error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

const DeleteBody = z.object({
	partnerId: z.number().int().positive(),
	imageId: z.string().min(1),
})

/** DELETE: удаление изображения из галереи по id. */
export async function DELETE(request: NextRequest) {
	try {
		requireAuth(request)
		const json = await request.json().catch(() => null)
		const parsed = DeleteBody.safeParse(json)
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid body" }, { status: 400 })
		}

		const { partnerId, imageId } = parsed.data
		const existing = readGallery(partnerId)
		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}

		const target = existing.images.find((item) => item.id === imageId)
		if (!target) {
			return NextResponse.json({ error: "Image not found" }, { status: 404 })
		}

		const nextImages = existing.images.filter((item) => item.id !== imageId)
		const updated = writeGallery(partnerId, nextImages)
		if (!updated) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}
		await deletePartnerGalleryImageObjects(target)

		return NextResponse.json({
			data: { partner: updated, images: nextImages },
			meta: null,
		})
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Delete partner gallery image error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

const ReorderBody = z.object({
	partnerId: z.number().int().positive(),
	imageIds: z.array(z.string().min(1)),
})

/** PUT: порядок изображений галереи (DnD). */
export async function PUT(request: NextRequest) {
	try {
		requireAuth(request)
		const json = await request.json().catch(() => null)
		const parsed = ReorderBody.safeParse(json)
		if (!parsed.success) {
			return NextResponse.json({ error: "Invalid body" }, { status: 400 })
		}

		const { partnerId, imageIds } = parsed.data
		const existing = readGallery(partnerId)
		if (!existing) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}

		if (imageIds.length !== existing.images.length) {
			return NextResponse.json({ error: "imageIds length mismatch" }, { status: 400 })
		}

		const byId = new Map(existing.images.map((item) => [item.id, item]))
		const nextImages: PartnerCaseGalleryImage[] = []
		for (const id of imageIds) {
			const item = byId.get(id)
			if (!item) {
				return NextResponse.json({ error: `Unknown imageId: ${id}` }, { status: 400 })
			}
			nextImages.push(item)
			byId.delete(id)
		}
		if (byId.size > 0) {
			return NextResponse.json({ error: "imageIds incomplete" }, { status: 400 })
		}

		const updated = writeGallery(partnerId, nextImages)
		if (!updated) {
			return NextResponse.json({ error: "Partner not found" }, { status: 404 })
		}

		return NextResponse.json({
			data: { partner: updated, images: nextImages },
			meta: null,
		})
	} catch (error: unknown) {
		if (error instanceof Error && error.message === "Unauthorized") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}
		console.error("Reorder partner gallery error:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
