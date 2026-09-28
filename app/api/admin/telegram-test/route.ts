import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { isTelegramConfigured, sendTelegramMessage, escapeTelegramHtml } from "@/lib/telegram/send-message"

export const runtime = "nodejs"

/** Статус: настроен ли Telegram в .env (без раскрытия секретов). */
export async function GET(request: NextRequest) {
  try {
    requireAuth(request)
    return NextResponse.json({
      data: {
        configured: isTelegramConfigured(),
      },
      meta: null,
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** Демо-сообщение в TELEGRAM_CHAT_ID. */
export async function POST(request: NextRequest) {
  try {
    requireAuth(request)

    if (!isTelegramConfigured()) {
      return NextResponse.json(
        { error: "Telegram is not configured", hint: "Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env" },
        { status: 400 },
      )
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "local"
    const when = new Date().toLocaleString("ru-RU", {
      timeZone: "Europe/Moscow",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    const result = await sendTelegramMessage(
      [
        "🧪 <b>Тест Telegram</b>",
        "──────────────",
        `<b>Сайт:</b> ${escapeTelegramHtml(site)}`,
        `<b>Время:</b> ${escapeTelegramHtml(when)} (МСК)`,
        "",
        "Если вы видите это сообщение — бот и chat id настроены верно.",
      ].join("\n"),
      { parseMode: "HTML" },
    )

    if (!result.ok) {
      console.error("Telegram test failed:", result.error)
      return NextResponse.json({ error: result.error || "Failed to send test message" }, { status: 502 })
    }

    return NextResponse.json({ data: { success: true, messageId: result.messageId }, meta: null })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Telegram test error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
