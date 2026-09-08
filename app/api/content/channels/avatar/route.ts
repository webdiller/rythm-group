import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tableChannels } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import {
  deleteChannelAvatarIfStored,
  uploadChannelAvatarWebp,
} from "@/lib/s3/channel-avatar"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const file = formData.get("file")
    const channelIdRaw = formData.get("channelId")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    if (!channelIdRaw) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const channelId = Number(channelIdRaw)
    if (Number.isNaN(channelId)) {
      return NextResponse.json({ error: "channelId must be a number" }, { status: 400 })
    }

    const size = file.size
    const maxSizeBytes = 5 * 1024 * 1024
    if (size > maxSizeBytes) {
      return NextResponse.json({ error: "File size must not exceed 5MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const optimizedBuffer = await sharp(inputBuffer)
      .resize(256, 256, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer()

    const db = getDb()
    const existing = db
      .select({ avatar: tableChannels.avatar })
      .from(tableChannels)
      .where(eq(tableChannels.id, channelId))
      .get()

    if (!existing) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const key = await uploadChannelAvatarWebp(channelId, optimizedBuffer)

    const [updated] = db
      .update(tableChannels)
      .set({ avatar: key })
      .where(eq(tableChannels.id, channelId))
      .returning()
      .all()

    if (!updated) {
      await deleteChannelAvatarIfStored(key)
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    if (existing.avatar && existing.avatar !== key) {
      await deleteChannelAvatarIfStored(existing.avatar)
    }

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload channel avatar error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const channelIdRaw = formData.get("channelId")

    if (!channelIdRaw) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 })
    }

    const channelId = Number(channelIdRaw)
    if (Number.isNaN(channelId)) {
      return NextResponse.json({ error: "channelId must be a number" }, { status: 400 })
    }

    const db = getDb()
    const existing = db
      .select({ avatar: tableChannels.avatar })
      .from(tableChannels)
      .where(eq(tableChannels.id, channelId))
      .get()

    if (!existing) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const [updated] = db
      .update(tableChannels)
      .set({ avatar: null })
      .where(eq(tableChannels.id, channelId))
      .returning()
      .all()

    if (!updated) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    await deleteChannelAvatarIfStored(existing.avatar)

    return NextResponse.json({ data: updated, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Delete channel avatar error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
