/** Telegram Bot API helpers. Token and chat id come from process.env only. */

export type TelegramSendResult =
  | { ok: true; messageId?: number }
  | { ok: false; error: string; status?: number }

export type SendTelegramMessageOptions = {
  /** Telegram parse_mode. Prefer HTML with escaped user input. */
  parseMode?: "HTML"
}

export function getTelegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return null
  return { token, chatId }
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() != null
}

/** Escape text for Telegram HTML parse_mode. */
export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Send a message to TELEGRAM_CHAT_ID.
 */
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
