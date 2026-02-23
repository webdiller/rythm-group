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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Build mailto link with form data
    const subject = encodeURIComponent(`Rythm Group Ad Request: ${formData.company}`)
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\nBudget: ${formData.budget}\n\nMessage:\n${formData.message}`
    )
    window.open(`mailto:ads@rythmgroup.com?subject=${subject}&body=${body}`, "_blank")
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

        <div className="mx-auto grid max-w-2xl gap-8">
          {/* Form */}
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
