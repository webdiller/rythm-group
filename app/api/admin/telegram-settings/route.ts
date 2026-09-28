import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { encryptSecret, isSecretsEncryptionConfigured } from "@/lib/secrets/crypto"
import { getTelegramConfigStatus } from "@/lib/telegram/send-message"

export const runtime = "nodejs"

type PutBody = {
  /** New bot token; omit / empty string with keepToken=true to leave unchanged; null to clear */
  botToken?: string | null
  chatId?: string | null
  /** When true and botToken empty — keep existing encrypted token */
  keepToken?: boolean
  keepChatId?: boolean
}

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    return NextResponse.json({ data: getTelegramConfigStatus(), meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    requireAuth(request)

    if (!isSecretsEncryptionConfigured()) {
      return NextResponse.json(
        {
          error: "Encryption key missing",
          hint: "Добавьте SECRETS_ENCRYPTION_KEY в .env и перезапустите приложение",
        },
        { status: 400 },
      )
    }

    const body = (await request.json()) as PutBody
    const db = getDb()
    const existing = db.select().from(tableSiteSettings).limit(1).all()[0]

    let nextTokenEnc: string | null | undefined = undefined
    let nextChatEnc: string | null | undefined = undefined

    if (body.keepToken) {
      nextTokenEnc = undefined // no change
    } else if (body.botToken === null || body.botToken === "") {
      nextTokenEnc = null
    } else if (typeof body.botToken === "string" && body.botToken.trim()) {
      nextTokenEnc = encryptSecret(body.botToken.trim())
    }

    if (body.keepChatId) {
      nextChatEnc = undefined
    } else if (body.chatId === null || body.chatId === "") {
      nextChatEnc = null
    } else if (typeof body.chatId === "string" && body.chatId.trim()) {
      nextChatEnc = encryptSecret(body.chatId.trim())
    }

    if (existing) {
      const patch: { telegram_bot_token_enc?: string | null; telegram_chat_id_enc?: string | null } = {}
      if (nextTokenEnc !== undefined) patch.telegram_bot_token_enc = nextTokenEnc
      if (nextChatEnc !== undefined) patch.telegram_chat_id_enc = nextChatEnc
      if (Object.keys(patch).length > 0) {
        db.update(tableSiteSettings).set(patch).where(eq(tableSiteSettings.id, existing.id)).run()
      }
    } else {
      db.insert(tableSiteSettings)
        .values({
          telegram_bot_token_enc: nextTokenEnc === undefined ? null : nextTokenEnc,
          telegram_chat_id_enc: nextChatEnc === undefined ? null : nextChatEnc,
        })
        .run()
    }

    return NextResponse.json({ data: getTelegramConfigStatus(), meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes("SECRETS_ENCRYPTION_KEY")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Telegram settings save error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
