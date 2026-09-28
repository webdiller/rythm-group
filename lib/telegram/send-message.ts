import { getDb } from "@/lib/db"
import { tableSiteSettings } from "@/lib/db/schema"
import { decryptSecret } from "@/lib/secrets/crypto"

/** Telegram Bot API helpers. */

export type TelegramSendResult =
  | { ok: true; messageId?: number }
  | { ok: false; error: string; status?: number }

export type SendTelegramMessageOptions = {
  parseMode?: "HTML"
}

export type TelegramConfigSource = "admin" | "env" | "mixed" | "none"

/**
 * Resolve token + chat id: encrypted admin values first, then .env fallback.
 */
export function getTelegramConfig(): { token: string; chatId: string; source: TelegramConfigSource } | null {
  let dbToken: string | null = null
  let dbChatId: string | null = null

  try {
    const db = getDb()
    const row = db
      .select({
        telegram_bot_token_enc: tableSiteSettings.telegram_bot_token_enc,
        telegram_chat_id_enc: tableSiteSettings.telegram_chat_id_enc,
      })
      .from(tableSiteSettings)
      .limit(1)
      .get()
    dbToken = decryptSecret(row?.telegram_bot_token_enc)
    dbChatId = decryptSecret(row?.telegram_chat_id_enc)
  } catch {
    // DB may be unavailable during some tooling; fall back to env
  }

  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || null
  const envChatId = process.env.TELEGRAM_CHAT_ID?.trim() || null

  const token = dbToken || envToken
  const chatId = dbChatId || envChatId
  if (!token || !chatId) return null

  const fromDb = Boolean(dbToken && dbChatId)
  const fromEnv = Boolean(envToken && envChatId)
  const source: TelegramConfigSource = fromDb ? "admin" : fromEnv ? "env" : "mixed"

  return { token, chatId, source }
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() != null
}

export function getTelegramConfigStatus(): {
  configured: boolean
  encryptionReady: boolean
  tokenInAdmin: boolean
  chatIdInAdmin: boolean
  tokenInEnv: boolean
  chatIdInEnv: boolean
  source: TelegramConfigSource
} {
  const encryptionReady = Boolean(process.env.SECRETS_ENCRYPTION_KEY?.trim())
  let tokenInAdmin = false
  let chatIdInAdmin = false

  try {
    const db = getDb()
    const row = db
      .select({
        telegram_bot_token_enc: tableSiteSettings.telegram_bot_token_enc,
        telegram_chat_id_enc: tableSiteSettings.telegram_chat_id_enc,
      })
      .from(tableSiteSettings)
      .limit(1)
      .get()
    tokenInAdmin = Boolean(decryptSecret(row?.telegram_bot_token_enc))
    chatIdInAdmin = Boolean(decryptSecret(row?.telegram_chat_id_enc))
  } catch {
    // ignore
  }

  const tokenInEnv = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim())
  const chatIdInEnv = Boolean(process.env.TELEGRAM_CHAT_ID?.trim())
  const config = getTelegramConfig()

  return {
    configured: config != null,
    encryptionReady,
    tokenInAdmin,
    chatIdInAdmin,
    tokenInEnv,
    chatIdInEnv,
    source: config?.source ?? "none",
  }
}

export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export async function sendTelegramMessage(
  text: string,
  options?: SendTelegramMessageOptions,
): Promise<TelegramSendResult> {
  const config = getTelegramConfig()
  if (!config) {
    return { ok: false, error: "Telegram is not configured" }
  }

  const body: Record<string, unknown> = {
    chat_id: config.chatId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
  }
  if (options?.parseMode) {
    body.parse_mode = options.parseMode
  }

  let res: Response
  try {
    res = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error"
    return { ok: false, error: message }
  }

  let json: { ok?: boolean; description?: string; result?: { message_id?: number } } = {}
  try {
    json = (await res.json()) as typeof json
  } catch {
    // ignore parse errors
  }

  if (!res.ok || !json.ok) {
    return {
      ok: false,
      status: res.status,
      error: json.description || `Telegram API error (${res.status})`,
    }
  }

  return { ok: true, messageId: json.result?.message_id }
}

function field(label: string, value: string): string {
  return `<b>${escapeTelegramHtml(label)}:</b> ${escapeTelegramHtml(value)}`
}

export function formatContactTelegramMessage(data: {
  scope: string
  name: string
  email: string
  company: string
  budget: string
  message: string
}): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""
  const formLabel = data.scope === "affiliate" ? "Wishlists" : "Landing"
  const when = new Date().toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const lines = [
    "📩 <b>Новая заявка с сайта</b>",
    "──────────────",
    site ? field("Сайт", site) : null,
    field("Форма", formLabel),
    field("Время", `${when} (МСК)`),
    "",
    field("Имя", data.name),
    field("Email", data.email),
    field("Компания", data.company.trim() || "—"),
    field("Бюджет", data.budget.trim() || "—"),
    "",
    "<b>Сообщение</b>",
    escapeTelegramHtml(data.message.trim()),
  ]

  return lines.filter((line): line is string => line != null).join("\n")
}
