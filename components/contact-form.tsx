"use client"

import { useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { Send, MessageCircle, Mail } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"

export function ContactForm() {
  const { locale, t } = useLocale()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          budget: formData.budget,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        const json = (await response.json().catch(() => null)) as { error?: string } | null
        setStatus("error")
        setErrorMessage(json?.error ?? "Не удалось отправить сообщение. Попробуйте ещё раз.")
        return
      }

      setStatus("success")
      setFormData({
        name: "",
        email: "",
        company: "",
        budget: "",
        message: "",
      })
    } catch (error) {
      setStatus("error")
      setErrorMessage("Не удалось отправить сообщение. Попробуйте ещё раз.")
    } finally {
      if (status !== "error") {
        setTimeout(() => {
          setStatus("idle")
        }, 4000)
      }
    }
  }

  return (
    <section id="contact" className="relative px-6 py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              {t.contact.title}
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">
              {t.contact.subtitle}
            </p>
          </div>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-5">
          {/* Form */}
          <ScrollReveal className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-xl border border-border bg-card p-8"
            >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-foreground">
                  {t.contact.name}
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-foreground">
                  {t.contact.email}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="john@company.com"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-company" className="mb-2 block text-sm font-medium text-foreground">
                  {t.contact.company}
                </label>
                <input
                  id="contact-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Company Inc."
                />
              </div>
              <div>
                <label htmlFor="contact-budget" className="mb-2 block text-sm font-medium text-foreground">
                  {t.contact.budget}
                </label>
                <select
                  id="contact-budget"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="" className="text-muted-foreground">--</option>
                  {t.contact.budgetOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-foreground">
                {t.contact.message}
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(230,27,0,0.3)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {status === "loading" ? (locale === "ru" ? "Отправка..." : "Sending...") : t.contact.submit}
            </button>
            {status === "success" && (
              <p className="text-xs text-emerald-500">
                {locale === "ru" ? "Сообщение успешно отправлено." : "Message sent successfully."}
              </p>
            )}
            {status === "error" && errorMessage && (
              <p className="text-xs text-destructive">
                {errorMessage}
              </p>
            )}
            </form>
          </ScrollReveal>

          {/* Direct contact */}
          <ScrollReveal rootMargin="100px" className="lg:col-span-2">
            <div className="flex flex-col gap-5">
            <div className="flex-1 rounded-xl border border-border bg-card p-8">
              <p className="mb-6 text-sm text-muted-foreground">{t.contact.or}</p>

              <div className="flex flex-col gap-4">
                <ScrollStagger index={0} delayStep={80}>
                  <a
                    href="https://t.me/rythmgroup_ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#229ED9]/10 text-[#229ED9]">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-foreground">{t.contact.telegram}</span>
                      <span className="text-xs text-muted-foreground">@rythmgroup_ads</span>
                    </div>
                  </a>
                </ScrollStagger>

                <ScrollStagger index={1} delayStep={80}>
                  <a
                    href="mailto:ads@rythmgroup.com"
                    className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-foreground">{t.contact.emailUs}</span>
                      <span className="text-xs text-muted-foreground">ads@rythmgroup.com</span>
                    </div>
                  </a>
                </ScrollStagger>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-2 gap-4">
              <ScrollStagger index={0} delayStep={100}>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <span className="block text-2xl font-bold text-primary text-glow">{"<"} 1h</span>
                  <span className="text-xs text-muted-foreground">
                    {locale === "ru" ? "Время ответа" : "Response Time"}
                  </span>
                </div>
              </ScrollStagger>
              <ScrollStagger index={1} delayStep={100}>
                <div className="rounded-xl border border-border bg-card p-5 text-center">
                  <span className="block text-2xl font-bold text-primary text-glow">24/7</span>
                  <span className="text-xs text-muted-foreground">
                    {locale === "ru" ? "Поддержка" : "Support"}
                  </span>
                </div>
              </ScrollStagger>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
