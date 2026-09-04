import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { z } from "zod"
import { ServiceContacts } from "@/lib/services/contacts"

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
      return NextResponse.json(
        { error: "Invalid payload", issues: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    const contactRow = ServiceContacts.getByContext(data.scope) ?? ServiceContacts.getByContext("landing")
    const rawEmails = contactRow?.email ?? ""
    const recipients = rawEmails
      .split(/[;,]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    const fallbackEmail = process.env.CONTACT_FALLBACK_EMAIL
    const toList = recipients.length > 0 ? recipients : fallbackEmail ? [fallbackEmail] : []

    if (toList.length === 0) {
      return NextResponse.json(
        { error: "No recipient emails configured" },
        { status: 500 }
      )
    }

    const host = process.env.SMTP_HOST ?? "connect.smtp.bz"
    const port = Number(process.env.SMTP_PORT ?? 465)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM ?? user

    if (!host || !user || !pass || !from) {
      return NextResponse.json(
        { error: "SMTP is not configured" },
        { status: 500 }
      )
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: "api",
        pass: process.env.SEQUENZY_API_KEY,
      },
    })

    const subject =
      process.env.CONTACT_EMAIL_SUBJECT ??
      `New contact request from ${data.company || data.name}`

    const html = `
      <h1>New contact request</h1>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Company:</strong> ${data.company || "-"}</p>
      <p><strong>Budget:</strong> ${data.budget || "-"}</p>
      <p><strong>Message:</strong></p>
      <p>${data.message.replace(/\n/g, "<br />")}</p>
    `

    await transporter.sendMail({
      from,
      to: toList,
      subject,
      replyTo: data.email,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact form send error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}

