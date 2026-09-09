"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { fallbackTranslations } from "@/lib/i18n"
import { getContactFormMessage, mapContactApiError } from "@/lib/contact-form-messages"
import { Send, MessageCircle, Mail, Instagram, Globe } from "lucide-react"
import { ScrollReveal } from "@/components/ui/scroll-reveal"
import { ScrollStagger } from "@/components/ui/scroll-stagger"
import Link from "next/link"

type DirectContactLink = {
  id: string
  url: string
  type: "telegram" | "email" | "instagram" | "max" | "other"
  icon?: string | null
  label_ru: string
  label_en: string
  description_ru?: string
  description_en?: string
}

type ContactLayout = "formFirst" | "contactsFirst"
type ContactScope = "landing" | "affiliate"
type MiniStatItem = {
  id: "fastResponse" | "support"
  value: string
  label_ru: string
  label_en: string
}

export function ContactForm({ animationsEnabled = true, layout = "formFirst", hideForm = false, scope = "landing" }: { animationsEnabled?: boolean; layout?: ContactLayout; hideForm?: boolean; scope?: ContactScope }) {
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
  const [directContacts, setDirectContacts] = useState<DirectContactLink[]>([])
  const [miniStats, setMiniStats] = useState<MiniStatItem[]>([
    {
      id: "fastResponse",
      value: fallbackTranslations.ru.contact.miniStats.fastResponseValue,
      label_ru: fallbackTranslations.ru.contact.miniStats.fastResponseLabel,
      label_en: fallbackTranslations.en.contact.miniStats.fastResponseLabel,
    },
    {
      id: "support",
      value: fallbackTranslations.ru.contact.miniStats.supportValue,
      label_ru: fallbackTranslations.ru.contact.miniStats.supportLabel,
      label_en: fallbackTranslations.en.contact.miniStats.supportLabel,
    },
  ])

  useEffect(() => {
    const loadDirectContacts = async () => {
      try {
        const response = await fetch(`/api/content/contacts?context=${scope}`)
        if (!response.ok) return
        const json = (await response.json()) as {
          data?:
            | {
                email?: string | null
                telegram_url?: string | null
                telegram_username?: string | null
                direct_contacts?: string | null
                mini_stats?: string | null
              }
            | Array<{
                email?: string | null
                telegram_url?: string | null
                telegram_username?: string | null
                direct_contacts?: string | null
                mini_stats?: string | null
              }>
        }
        let row = (Array.isArray(json.data) ? json.data[0] : json.data) ?? null

        // Backward/empty-state fallback: if affiliate context has no dedicated row yet,
        // use landing contacts so the section is not empty until it is configured.
        if (!row && scope === "affiliate") {
          const fallbackRes = await fetch("/api/content/contacts?context=landing")
          if (fallbackRes.ok) {
            const fallbackJson = (await fallbackRes.json()) as {
              data?:
                | {
                    email?: string | null
                    telegram_url?: string | null
                    telegram_username?: string | null
                    direct_contacts?: string | null
                    mini_stats?: string | null
                  }
                | Array<{
                    email?: string | null
                    telegram_url?: string | null
                    telegram_username?: string | null
                    direct_contacts?: string | null
                    mini_stats?: string | null
                  }>
            }
            row = (Array.isArray(fallbackJson.data) ? fallbackJson.data[0] : fallbackJson.data) ?? null
          }
        }
        if (!row) return

        let links: DirectContactLink[] = []

        if (row.direct_contacts) {
          try {
            const parsed = JSON.parse(row.direct_contacts) as unknown
            if (Array.isArray(parsed)) {
              links = (parsed as unknown[])
                .map((item): DirectContactLink | null => {
                  if (!item || typeof item !== "object") return null
                  const raw = item as Record<string, unknown>
                  const url = typeof raw.url === "string" ? raw.url : ""
                  const labelRu = typeof raw.label_ru === "string" ? raw.label_ru : typeof raw.label === "string" ? raw.label : ""
                  const labelEn = typeof raw.label_en === "string" ? raw.label_en : ""
                  if (!url || (!labelRu && !labelEn && typeof (raw as { label?: string }).label !== "string")) return null
                  const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                  const descriptionRu = typeof raw.description_ru === "string" ? raw.description_ru : typeof raw.description === "string" ? raw.description : ""
                  const descriptionEn = typeof raw.description_en === "string" ? raw.description_en : ""
                  const typeValue = typeof raw.type === "string" ? raw.type : "other"
                  const type: DirectContactLink["type"] = typeValue === "telegram" || typeValue === "email" || typeValue === "instagram" || typeValue === "max" ? typeValue : "other"
                  const icon = typeof raw.icon === "string" ? raw.icon : null
                  return {
                    id,
                    url,
                    type,
                    icon,
                    label_ru: labelRu,
                    label_en: labelEn,
                    description_ru: descriptionRu || undefined,
                    description_en: descriptionEn || undefined,
                  }
                })
                .filter((v): v is DirectContactLink => v !== null)
            }
          } catch {
            // ignore and fall back to defaults
          }
        }

        if (links.length === 0) {
          const fallback: DirectContactLink[] = []
          if (row.telegram_url) {
            fallback.push({
              id: "telegram-fallback",
              type: "telegram",
              label_ru: "",
              label_en: "",
              url: row.telegram_url,
              description_ru: row.telegram_username ?? undefined,
              description_en: row.telegram_username ?? undefined,
            })
          }
          if (row.email) {
            const firstEmail = row.email.split(",")[0]?.trim()
            if (firstEmail) {
              fallback.push({
                id: "email-fallback",
                type: "email",
                label_ru: "",
                label_en: "",
                url: `mailto:${firstEmail}`,
                description_ru: row.email,
                description_en: row.email,
              })
            }
          }
          links = fallback
        }

        setDirectContacts(links)

        if (row.mini_stats) {
          try {
            const parsed = JSON.parse(row.mini_stats) as unknown
            if (Array.isArray(parsed)) {
              const parsedStats = (parsed as unknown[])
                .map((item): MiniStatItem | null => {
                  if (!item || typeof item !== "object") return null
                  const raw = item as Record<string, unknown>
                  const id = raw.id === "support" ? "support" : raw.id === "fastResponse" ? "fastResponse" : null
                  if (!id) return null
                  return {
                    id,
                    value: typeof raw.value === "string" ? raw.value : "",
                    label_ru: typeof raw.label_ru === "string" ? raw.label_ru : "",
                    label_en: typeof raw.label_en === "string" ? raw.label_en : "",
                  }
                })
                .filter((v): v is MiniStatItem => v !== null)
              const byId = new Map(parsedStats.map((s) => [s.id, s]))
              setMiniStats([byId.get("fastResponse") ?? miniStats[0], byId.get("support") ?? miniStats[1]])
            }
          } catch {
            // ignore and keep i18n defaults
          }
        }
      } catch {
        // silent failure, we still have the form as main CTA
      }
    }

    void loadDirectContacts()
  }, [scope])

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
          scope,
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
        setErrorMessage(mapContactApiError(json?.error, locale))
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
      window.setTimeout(() => {
        setStatus("idle")
      }, 4000)
    } catch {
      setStatus("error")
      setErrorMessage(getContactFormMessage(locale, "network"))
    }
  }

  return (
    <section
      id="contact"
      className="relative px-6 py-12 md:py-16"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/3 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <ScrollReveal disabled={!animationsEnabled}>
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl text-balance">{t.contact.title}</h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg text-pretty">{t.contact.subtitle}</p>
          </div>
        </ScrollReveal>

        <div className={hideForm ? "mx-auto max-w-2xl" : "mx-auto grid max-w-5xl gap-8 lg:grid-cols-5"}>
          {/* Form */}
          {!hideForm && (
            <ScrollReveal
              className={layout === "formFirst" ? "lg:col-span-3 lg:order-1" : "lg:col-span-3 lg:order-2"}
              disabled={!animationsEnabled}
            >
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-xl border border-border bg-card p-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
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
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
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
                    <label
                      htmlFor="contact-company"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
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
                    <label
                      htmlFor="contact-budget"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {t.contact.budget}
                    </label>
                    <select
                      id="contact-budget"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option
                        value=""
                        className="text-muted-foreground"
                      >
                        --
                      </option>
                      {t.contact.budgetOptions.map((opt) => (
                        <option
                          key={opt}
                          value={opt}
                        >
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
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
                  {status === "loading" ? getContactFormMessage(locale, "sending") : t.contact.submit}
                </button>
                {status === "success" && <p className="text-xs text-emerald-500">{getContactFormMessage(locale, "success")}</p>}
                {status === "error" && errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
              </form>
            </ScrollReveal>
          )}

          {/* Direct contact */}
          <ScrollReveal
            rootMargin="100px"
            className={hideForm ? "w-full" : layout === "formFirst" ? "lg:col-span-2 lg:order-2" : "lg:col-span-2 lg:order-1"}
            disabled={!animationsEnabled}
          >
            <div className="flex flex-col gap-5">
              {directContacts.length > 0 && (
                <div className="flex-1 rounded-xl border border-border bg-card p-8">
                  <p className="mb-6 text-sm text-muted-foreground">{t.contact.or}</p>

                  <div className="flex flex-col gap-4">
                    {directContacts.map((link, index) => {
                      const isTelegram = link.type === "telegram"
                      const isEmail = link.type === "email"
                      const isInstagram = link.type === "instagram"

                      const label =
                        isTelegram || isEmail
                          ? (locale === "ru" ? link.label_ru || link.label_en || "" : link.label_en || link.label_ru || "").trim() || (isTelegram ? t.contact.telegram : t.contact.emailUs)
                          : locale === "ru"
                            ? link.label_ru || link.label_en || ""
                            : link.label_en || link.label_ru || ""
                      const description = locale === "ru" ? link.description_ru || link.description_en || "" : link.description_en || link.description_ru || ""

                      const Icon = isEmail ? Mail : isInstagram ? Instagram : isTelegram ? MessageCircle : Globe
                      const iconClasses = isTelegram ? "bg-[#229ED9]/10 text-[#229ED9]" : isEmail ? "bg-primary/10 text-primary" : isInstagram ? "bg-pink-500/10 text-pink-500" : "bg-secondary text-secondary-foreground"

                      return (
                        <ScrollStagger
                          key={link.id}
                          index={index}
                          delayStep={80}
                          disabled={!animationsEnabled}
                        >
                          <Link
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 rounded-lg border border-border bg-secondary/50 p-4 transition-all hover:border-primary/30 hover:bg-secondary"
                          >
                            {link.icon ? (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground overflow-hidden">
                                <img
                                  src={link.icon.startsWith("data:") ? link.icon : `/${link.icon}`}
                                  alt={label}
                                  className="h-10 w-10 object-contain"
                                />
                              </div>
                            ) : (
                              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconClasses}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <span className="block text-sm font-semibold text-foreground">{label}</span>
                              {description && <span className="text-xs text-muted-foreground">{description}</span>}
                            </div>
                          </Link>
                        </ScrollStagger>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-4">
                <ScrollStagger
                  index={0}
                  delayStep={100}
                  disabled={!animationsEnabled}
                >
                  <div className="rounded-xl border border-border bg-card p-5 text-center">
                    <span className="block text-2xl font-bold text-primary text-glow">{miniStats[0].value || t.contact.miniStats.fastResponseValue}</span>
                    <span className="text-xs text-muted-foreground">{locale === "ru" ? miniStats[0].label_ru || t.contact.miniStats.fastResponseLabel : miniStats[0].label_en || t.contact.miniStats.fastResponseLabel}</span>
                  </div>
                </ScrollStagger>
                <ScrollStagger
                  index={1}
                  delayStep={100}
                  disabled={!animationsEnabled}
                >
                  <div className="rounded-xl border border-border bg-card p-5 text-center">
                    <span className="block text-2xl font-bold text-primary text-glow">{miniStats[1].value || t.contact.miniStats.supportValue}</span>
                    <span className="text-xs text-muted-foreground">{locale === "ru" ? miniStats[1].label_ru || t.contact.miniStats.supportLabel : miniStats[1].label_en || t.contact.miniStats.supportLabel}</span>
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
