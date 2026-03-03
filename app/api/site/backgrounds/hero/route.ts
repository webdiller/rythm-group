import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import path from "node:path"
import { promises as fs } from "node:fs"

export const runtime = "nodejs"

const HERO_BG_DIR = path.join(process.cwd(), "public", "backgrounds")

function getHeroPath(theme?: string | null) {
  if (theme === "light") return path.join(HERO_BG_DIR, "hero-light.webp")
  if (theme === "dark") return path.join(HERO_BG_DIR, "hero-dark.webp")
  return path.join(HERO_BG_DIR, "hero.webp")
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const theme = searchParams.get("theme")
  const targetPath = getHeroPath(theme)

  try {
    const fileBuffer = await fs.readFile(targetPath)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    })
  } catch {
    // Если файла нет (в том числе после сброса), просто не используем картинку
    return new NextResponse(null, { status: 404 })
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    const { searchParams } = new URL(request.url)
    const theme = searchParams.get("theme")

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
    await fs.writeFile(getHeroPath(theme), optimizedBuffer)

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

    const { searchParams } = new URL(request.url)
    const theme = searchParams.get("theme")
    const targetPath = getHeroPath(theme)

    try {
      await fs.unlink(targetPath)
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

