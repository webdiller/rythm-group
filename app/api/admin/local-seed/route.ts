import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { dryRunLocalSeed, executeLocalSeed } from "@/lib/local-seed"
import { LocalSeedExecuteBody } from "@/lib/local-seed/types"

export const runtime = "nodejs"

/** Dry-run: проверка scripts/data.local.json + public/avatars без записи. */
export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const result = await dryRunLocalSeed()
    return NextResponse.json({ data: result, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Local seed dry-run error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** Импорт каналов/партнёров/about/faq/formats из data.local.json. Body: { confirm: "IMPORT" } */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json().catch(() => null)
    const parsed = LocalSeedExecuteBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Введите confirm: "IMPORT" для подтверждения' },
        { status: 400 },
      )
    }

    const result = await executeLocalSeed()
    return NextResponse.json({ data: result, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "LOCAL_SEED_DISABLED") {
      return NextResponse.json(
        {
          error: "LOCAL_SEED_DISABLED",
          message: "Добавьте ALLOW_DEMO_SEED=1 в .env и перезапустите приложение",
        },
        { status: 403 },
      )
    }
    if (error instanceof Error && error.message.startsWith("LOCAL_DATA_")) {
      return NextResponse.json({ error: error.message, message: error.message }, { status: 404 })
    }
    console.error("Local seed execute error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
