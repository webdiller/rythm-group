import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { formatContactTelegramMessage, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram/send-message"

const ContactFormSchema = z.object({
  scope: z.enum(["landing", "affiliate"]).optional().default("landing"),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional().default(""),
  budget: z.string().optional().default(""),
  message: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json()
    const parsed = ContactFormSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 })
    }

    if (!isTelegramConfigured()) {
      return NextResponse.json({ error: "Telegram is not configured" }, { status: 500 })
    }

    const data = parsed.data
    const result = await sendTelegramMessage(formatContactTelegramMessage(data))

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
