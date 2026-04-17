import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { ServiceAboutCards } from "@/lib/services/about-cards"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const file = formData.get("file")
    const cardIdRaw = formData.get("cardId")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    if (!cardIdRaw) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 })
    }

    const cardId = Number(cardIdRaw)
    if (Number.isNaN(cardId)) {
      return NextResponse.json({ error: "cardId must be a number" }, { status: 400 })
    }

    const size = file.size
    const maxSizeBytes = 5 * 1024 * 1024
    if (size > maxSizeBytes) {
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const optimizedBuffer = await sharp(inputBuffer)
      .resize(128, 128, { fit: "inside", withoutEnlargement: false })
      .webp({ quality: 85 })
      .toBuffer()

    const base64 = optimizedBuffer.toString("base64")

    const result = ServiceAboutCards.setIconImage(cardId, base64)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload about card icon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const cardIdRaw = formData.get("cardId")

    if (!cardIdRaw) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 })
    }

    const cardId = Number(cardIdRaw)
    if (Number.isNaN(cardId)) {
      return NextResponse.json({ error: "cardId must be a number" }, { status: 400 })
    }

    const result = ServiceAboutCards.setIconImage(cardId, null)
    return NextResponse.json(result)
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete about card icon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
