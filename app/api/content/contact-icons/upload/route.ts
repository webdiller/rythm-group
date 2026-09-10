import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { requireAuth } from "@/lib/auth"
import { ServiceContactIcons } from "@/lib/services/contact-icons"
import { deleteContactIconIfStored, uploadContactIconFile } from "@/lib/s3/contact-icon"
import { DEFAULT_ICON_FILTERS } from "@/lib/contact-icons/filters"

export const runtime = "nodejs"

const MAX_BYTES = 2 * 1024 * 1024
const MAX_SIDE = 500
const ACCEPTED = new Set(["image/png", "image/svg+xml"])

function nameFromFile(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "").trim()
  return base || "icon"
}

async function processOneFile(file: File): Promise<{ name: string; buffer: Buffer; contentType: "image/png" | "image/svg+xml" }> {
  if (!ACCEPTED.has(file.type)) {
    throw new Error("INVALID_TYPE")
  }
  if (file.size > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE")
  }

  const arrayBuffer = await file.arrayBuffer()
  const input = Buffer.from(arrayBuffer)
  const name = nameFromFile(file)

  if (file.type === "image/svg+xml") {
    return { name, buffer: input, contentType: "image/svg+xml" }
  }

  const meta = await sharp(input).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (width > MAX_SIDE || height > MAX_SIDE) {
    const png = await sharp(input)
      .resize(MAX_SIDE, MAX_SIDE, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer()
    return { name, buffer: png, contentType: "image/png" }
  }

  const png = await sharp(input).png().toBuffer()
  return { name, buffer: png, contentType: "image/png" }
}

/**
 * Загрузка одной или нескольких иконок.
 * FormData: `file` | `files` (multi), опционально `iconId` — заменить файл у существующей.
 */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const formData = await request.formData()
    const iconIdRaw = formData.get("iconId")
    const replaceId =
      iconIdRaw != null && String(iconIdRaw).trim() !== "" ? Number(iconIdRaw) : null

    if (replaceId != null && !Number.isFinite(replaceId)) {
      return NextResponse.json({ error: "iconId must be a number" }, { status: 400 })
    }

    const collected: File[] = []
    const single = formData.get("file")
    if (single instanceof File && single.size > 0) collected.push(single)
    for (const value of formData.getAll("files")) {
      if (value instanceof File && value.size > 0) collected.push(value)
    }

    if (collected.length === 0) {
      return NextResponse.json({ error: "file or files required" }, { status: 400 })
    }

    if (replaceId != null && collected.length !== 1) {
      return NextResponse.json({ error: "Replace accepts exactly one file" }, { status: 400 })
    }

    const created = []
    for (const file of collected) {
      let processed
      try {
        processed = await processOneFile(file)
      } catch (e) {
        if (e instanceof Error && e.message === "INVALID_TYPE") {
          return NextResponse.json({ error: "Only PNG and SVG are allowed" }, { status: 400 })
        }
        if (e instanceof Error && e.message === "FILE_TOO_LARGE") {
          return NextResponse.json({ error: "File size must not exceed 2MB" }, { status: 400 })
        }
        throw e
      }

      const key = await uploadContactIconFile(processed.buffer, processed.contentType)

      try {
        if (replaceId != null) {
          const previous = ServiceContactIcons.getS3KeyRaw(replaceId)
          const item = ServiceContactIcons.setS3Key(replaceId, key)
          if (previous && previous !== key) {
            await deleteContactIconIfStored(previous)
          }
          created.push(item)
        } else {
          const item = ServiceContactIcons.createOne({
            name: processed.name,
            s3_key: key,
            filter_light: DEFAULT_ICON_FILTERS,
            filter_dark: null,
          })
          created.push(item)
        }
      } catch (error) {
        await deleteContactIconIfStored(key)
        if (error instanceof Error && error.message === "Contact icon not found") {
          return NextResponse.json({ error: "Not found" }, { status: 404 })
        }
        throw error
      }
    }

    return NextResponse.json(
      { data: replaceId != null ? created[0] : created, meta: null },
      { status: replaceId != null ? 200 : 201 },
    )
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Upload contact icon error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
