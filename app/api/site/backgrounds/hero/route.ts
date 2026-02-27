import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import path from "node:path"
import { promises as fs } from "node:fs"

export const runtime = "nodejs"

const HERO_BG_DIR = path.join(process.cwd(), "public", "backgrounds")
const HERO_BG_PATH = path.join(HERO_BG_DIR, "hero.webp")

export async function GET() {
  try {
    const fileBuffer = await fs.readFile(HERO_BG_PATH)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    return new NextResponse(null, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    const fileType = (file as File).type || ""
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "Допустимые форматы файлов: JPG, PNG, WebP" },
        { status: 400 }
      )
    }

    const size = file.size
    const maxSizeBytes = 5 * 1024 * 1024
    if (size > maxSizeBytes) {
      return NextResponse.json(
        { error: "Файл не должен превышать 5 МБ" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const image = sharp(inputBuffer)
    const metadata = await image.metadata()

    if (metadata.width && metadata.height && metadata.width < metadata.height) {
      return NextResponse.json(
        { error: "Изображение для hero должно быть горизонтальным (16:9)" },
        { status: 400 }
      )
    }

    const optimizedBuffer = await image
      .resize(1920, 1080, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer()

    await fs.mkdir(HERO_BG_DIR, { recursive: true })
    await fs.writeFile(HERO_BG_PATH, optimizedBuffer)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Upload hero background error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireAuth(request)
    try {
      await fs.unlink(HERO_BG_PATH)
    } catch {
      // ignore if file does not exist
    }
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete hero background error:", error)
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

