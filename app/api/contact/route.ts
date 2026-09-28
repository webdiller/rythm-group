import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { formatContactTelegramMessage, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/send-message"
import { consumeRateLimit, getRequestClientIp } from "@/lib/rate-limit"

const ContactFormSchema = z.object({
  scope: z.enum(["landing", "affiliate"]).optional().default("landing"),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(""),
  budget: z.string().optional().default(""),
  message: z.string().min(1),
})

/** Max contact submissions per unique client (IP + email) per minute. */
const CONTACT_RATE_LIMIT = 6
const CONTACT_RATE_WINDOW_MS = 60_000

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = ContactFormSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const ip = getRequestClientIp(request)
    const rateKey = `contact:${ip}:${data.email.trim().toLowerCase()}`
    const rate = consumeRateLimit(rateKey, CONTACT_RATE_LIMIT, CONTACT_RATE_WINDOW_MS)

    if (!rate.ok) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfterSec: rate.retryAfterSec,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rate.retryAfterSec) },
        },
      )
    }

    if (!isTelegramConfigured()) {
      return NextResponse.json({ error: "Telegram is not configured" }, { status: 500 })
    }

    const result = await sendTelegramMessage(formatContactTelegramMessage(data), { parseMode: "HTML" })

    if (!result.ok) {
      console.error("Contact form Telegram error:", result.error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form send error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
