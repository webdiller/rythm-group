/** Telegram Bot API helpers. Token and chat id come from process.env only. */

export type TelegramSendResult =
  | { ok: true; messageId?: number }
  | { ok: false; error: string; status?: number }

export function getTelegramConfig(): { token: string; chatId: string } | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim()
  if (!token || !chatId) return null
  return { token, chatId }
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig() != null
}

/**
 * Send a plain-text message to TELEGRAM_CHAT_ID.
 * Uses Bot API `sendMessage` (no HTML/Markdown — avoids injection/escaping issues).
 */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const config = getTelegramConfig()
  if (!config) {
    return { ok: false, error: "Telegram is not configured" }
  }

  const body = {
    chat_id: config.chatId,
    text: text.slice(0, 4096),
    disable_web_page_preview: true,
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

export function formatContactTelegramMessage(data: {
  scope: string
  name: string
  email: string
  company: string
  budget: string
  message: string
}): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""
  return [
    "Новая заявка с сайта",
    site ? `Сайт: ${site}` : null,
    `Форма: ${data.scope === "affiliate" ? "wishlists" : "landing"}`,
    `Имя: ${data.name}`,
    `Email: ${data.email}`,
    `Компания: ${data.company || "—"}`,
    `Бюджет: ${data.budget || "—"}`,
    "",
    "Сообщение:",
    data.message,
  ]
    .filter((line): line is string => line != null)
    .join("\n")
}
