import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { promises as fs } from "node:fs"
import { requireAuth } from "@/lib/auth"
import { type BackgroundKind, resolveBackgroundSlot, uploadBackgroundImage } from "@/lib/s3/backgrounds"
import { clearBackgroundKey, legacyBackgroundDiskPath, replaceBackgroundKey } from "@/lib/server/site-backgrounds"

type ProcessOptions = {
  kind: BackgroundKind
  orientationError: string
  requireLandscape: boolean
}

/** Только upload/delete (auth). Без resize / WebP-перекодирования — файл уходит в S3 как есть. */
export function createBackgroundRouteHandlers(options: ProcessOptions) {
  const { kind, orientationError, requireLandscape } = options

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

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"] as const
      const fileType = ((file as File).type || "") as (typeof allowedTypes)[number] | ""
      if (!allowedTypes.includes(fileType as (typeof allowedTypes)[number])) {
        return NextResponse.json({ error: "Допустимые форматы файлов: JPG, PNG, WebP" }, { status: 400 })
      }

      const maxSizeBytes = 5 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        return NextResponse.json({ error: "Файл не должен превышать 5 МБ" }, { status: 400 })
      }

      const inputBuffer = Buffer.from(await file.arrayBuffer())
      const metadata = await sharp(inputBuffer).metadata()

      if (metadata.width && metadata.height) {
        if (requireLandscape && metadata.width < metadata.height) {
          return NextResponse.json({ error: orientationError }, { status: 400 })
        }
        if (!requireLandscape && metadata.height < metadata.width) {
          return NextResponse.json({ error: orientationError }, { status: 400 })
        }
      }

      const key = await uploadBackgroundImage(slot, inputBuffer, fileType)
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
