import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { dryRunDemoSeed, executeDemoSeed } from "@/lib/demo-seed"
import { DemoSeedExecuteBody } from "@/lib/demo-seed/types"

export const runtime = "nodejs"

/** Dry-run: целостность + план удаления/создания без записи. */
export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    const result = await dryRunDemoSeed()
    return NextResponse.json({ data: result, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Demo seed dry-run error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** Выполнение wipe + seed. Body: { confirm: "RESET" } */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)
    const body = await request.json().catch(() => null)
    const parsed = DemoSeedExecuteBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Введите confirm: \"RESET\" для подтверждения" },
        { status: 400 },
      )
    }

    const result = await executeDemoSeed()
    return NextResponse.json({ data: result, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "DEMO_SEED_DISABLED") {
      return NextResponse.json(
        {
          error: "DEMO_SEED_DISABLED",
          message: "Добавьте ALLOW_DEMO_SEED=1 в .env и перезапустите приложение",
        },
        { status: 403 },
      )
    }
    if (error instanceof Error && error.message.startsWith("INTEGRITY_FAILED")) {
      return NextResponse.json({ error: "INTEGRITY_FAILED", message: error.message }, { status: 409 })
    }
    console.error("Demo seed execute error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
