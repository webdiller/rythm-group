"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Contact {
  id: number
  scope?: string | null
  email: string
  telegram_url: string
  telegram_username: string
  direct_contacts?: string | null
  mini_stats?: string | null
}
type ContactContext = "landing" | "affiliate"

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

type MiniStatItem = {
  id: "fastResponse" | "support"
  value: string
  label_ru: string
  label_en: string
}

const MAX_ICON_SIZE_BYTES = 500 * 1024
const ACCEPTED_ICON_TYPES = ["image/png", "image/svg+xml"]

function isCustomIcon(icon: string | null | undefined): boolean {
  return typeof icon === "string" && (icon.startsWith("data:") || icon === "custom")
}

export function ContactsEditor() {
  const [context, setContext] = useState<ContactContext>("landing")
  const [contact, setContact] = useState<Contact>({
    id: 0,
    email: "",
    telegram_url: "",
    telegram_username: "",
  })
  const [initialContact, setInitialContact] = useState<Contact | null>(null)
  const [directContacts, setDirectContacts] = useState<DirectContactLink[]>([])
  const [miniStats, setMiniStats] = useState<MiniStatItem[]>([
    { id: "fastResponse", value: "", label_ru: "", label_en: "" },
    { id: "support", value: "", label_ru: "", label_en: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    void loadContact(context)
  }, [context])

  const loadContact = async (nextContext: ContactContext) => {
    setLoading(true)
    setValidationError(null)
    try {
      const response = await fetch(`/api/content/contacts?context=${nextContext}`)
      if (response.ok) {
        const json = (await response.json()) as { data?: Contact | null }
        const loaded: Contact = json.data ?? {
          id: 0,
          email: "",
          telegram_url: "",
          telegram_username: "",
          direct_contacts: null,
        }

        setContact(loaded)
        setInitialContact(loaded)

        // Parse configurable direct contact links from JSON
        if (loaded.direct_contacts) {
          try {
            const parsed = JSON.parse(loaded.direct_contacts) as unknown
            if (Array.isArray(parsed)) {
              const links = (parsed as unknown[])
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

              setDirectContacts(links)
            } else {
              setDirectContacts([])
            }
          } catch {
            setDirectContacts([])
          }
        } else {
          setDirectContacts([])
        }

        if (loaded.mini_stats) {
          try {
            const parsed = JSON.parse(loaded.mini_stats) as unknown
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
              setMiniStats([
                byId.get("fastResponse") ?? {
                  id: "fastResponse",
                  value: "",
                  label_ru: "",
                  label_en: "",
                },
                byId.get("support") ?? { id: "support", value: "", label_ru: "", label_en: "" },
              ])
            } else {
              setMiniStats([
                { id: "fastResponse", value: "", label_ru: "", label_en: "" },
                { id: "support", value: "", label_ru: "", label_en: "" },
              ])
            }
          } catch {
            setMiniStats([
              { id: "fastResponse", value: "", label_ru: "", label_en: "" },
              { id: "support", value: "", label_ru: "", label_en: "" },
            ])
          }
        } else {
          setMiniStats([
            { id: "fastResponse", value: "", label_ru: "", label_en: "" },
            { id: "support", value: "", label_ru: "", label_en: "" },
          ])
        }
      }
    } catch (error) {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setValidationError(null)
    const invalid = directContacts.some((l) => !l.label_ru?.trim() || !l.label_en?.trim())
    if (invalid) {
      const msg = "У каждой ссылки должны быть заполнены подпись (RU) и подпись (EN)."
      setValidationError(msg)
      toast.error(msg)
      return
    }
    setSaving(true)
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1]
      const isCreate = !contact.id
      const payload: Contact = {
        ...contact,
        scope: context,
        direct_contacts: directContacts.length
          ? JSON.stringify(
              directContacts.map(({ icon, ...rest }) => ({
                ...rest,
                icon: icon === "custom" ? null : (icon ?? null),
              })),
            )
          : null,
        mini_stats: JSON.stringify(miniStats),
      }
      const response = await fetch("/api/content/contacts", {
        method: isCreate ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast.success(isCreate ? "Contact created" : "Contacts updated")
        if (isCreate) {
          void loadContact(context)
        } else {
          setInitialContact(payload)
        }
      } else {
        toast.error("Failed to save contacts")
      }
    } catch (error) {
      toast.error("Failed to save contacts")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contacts</h2>
      <Card>
        <CardHeader>
          <CardTitle>Edit Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contacts_context">Страница</Label>
            <select
              id="contacts_context"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={context}
              onChange={(e) => setContext(e.target.value === "affiliate" ? "affiliate" : "landing")}
            >
              <option value="landing">Главная страница</option>
              <option value="affiliate">Affiliate</option>
            </select>
            <p className="text-xs text-muted-foreground">Контакты для главной и страницы Affiliate редактируются отдельно.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email(s)</Label>
            <Input
              id="email"
              type="text"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="admin1@example.com, admin2@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">Укажите одну или несколько почт через запятую — на них будут приходить заявки с формы контактов.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram_url">Telegram URL</Label>
            <Input
              id="telegram_url"
              type="url"
              value={contact.telegram_url}
              onChange={(e) => setContact({ ...contact, telegram_url: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram_username">Telegram Username</Label>
            <Input
              id="telegram_username"
              value={contact.telegram_username}
              onChange={(e) => setContact({ ...contact, telegram_username: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label>Direct contact links (socials)</Label>
            <p className="text-xs text-muted-foreground">Добавьте ссылки на социальные сети, которые будут отображаться в блоке &quot;Связаться напрямую&quot;: Telegram, email, Instagram, MAX и любые другие.</p>
            <div className="space-y-3">
              {directContacts.map((link, index) => (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-[1fr,1fr,1.5fr,auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Label (RU)</Label>
                    <Input
                      value={link.label_ru}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], label_ru: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="Написать в Telegram"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Label (EN)</Label>
                    <Input
                      value={link.label_en}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], label_en: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="Message on Telegram"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">URL</Label>
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], url: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="https://t.me/RythmGroup"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label className="text-xs">Иконка</Label>
                    {/*
                      "none" = без иконки; "custom" = своя (файл или data URL в link.icon).
                      Select.Item не поддерживает пустой value.
                    */}
                    <Select
                      value={link.icon == null ? "none" : link.icon === "custom" || link.icon.startsWith("data:") ? "custom" : link.icon}
                      onValueChange={(value) => {
                        const next = [...directContacts]
                        next[index] = {
                          ...next[index],
                          icon: value === "none" ? null : value === "custom" ? "custom" : value,
                        }
                        setDirectContacts(next)
                      }}
                    >
                      <SelectTrigger className="h-8 px-2 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px]">—</span>
                            <span>Без иконки</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="icon-phone.svg">
                          <div className="flex items-center gap-2">
                            <img
                              src="/icon-phone.svg"
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                            <span>Телефон</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="icon-telegram.svg">
                          <div className="flex items-center gap-2">
                            <img
                              src="/icon-telegram.svg"
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                            <span>Telegram</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="icon-viber.svg">
                          <div className="flex items-center gap-2">
                            <img
                              src="/icon-viber.svg"
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                            <span>Viber</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="icon-whatsapp.svg">
                          <div className="flex items-center gap-2">
                            <img
                              src="/icon-whatsapp.svg"
                              alt=""
                              className="h-6 w-6 object-contain"
                            />
                            <span>WhatsApp</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            {link.icon?.startsWith("data:") ? (
                              <img
                                src={link.icon}
                                alt=""
                                className="h-6 w-6 object-contain"
                              />
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px]">+</span>
                            )}
                            <span>Своя иконка</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomIcon(link.icon) && (
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        <Input
                          type="file"
                          accept="image/png,image/svg+xml"
                          className="h-8 text-xs"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            if (file.size > MAX_ICON_SIZE_BYTES) {
                              toast.error(`Файл не должен превышать ${MAX_ICON_SIZE_BYTES / 1024} КБ`)
                              e.target.value = ""
                              return
                            }
                            if (!ACCEPTED_ICON_TYPES.includes(file.type)) {
                              toast.error("Допустимы только PNG и SVG")
                              e.target.value = ""
                              return
                            }
                            const dataUrl = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader()
                              reader.onload = () => resolve(reader.result as string)
                              reader.onerror = reject
                              reader.readAsDataURL(file)
                            })
                            const next = [...directContacts]
                            next[index] = { ...next[index], icon: dataUrl }
                            setDirectContacts(next)
                            e.target.value = ""
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const next = [...directContacts]
                            next[index] = { ...next[index], icon: null }
                            setDirectContacts(next)
                          }}
                        >
                          Удалить иконку
                        </Button>
                        <p className="text-[10px] text-muted-foreground">PNG или SVG, до 500 КБ</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description (RU)</Label>
                    <Input
                      value={link.description_ru ?? ""}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], description_ru: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="@RythmGroup"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description (EN)</Label>
                    <Input
                      value={link.description_en ?? ""}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], description_en: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="@RythmGroup"
                    />
                  </div>
                  <div className="flex items-end justify-end md:col-start-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDirectContacts((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDirectContacts((prev) => [
                    ...prev,
                    {
                      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                      label_ru: "",
                      label_en: "",
                      url: "",
                      type: "telegram",
                      icon: "icon-telegram.svg",
                    },
                  ])
                }
              >
                Добавить ссылку
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <Label>Mini stats (контактный блок)</Label>
            {miniStats.map((stat, index) => (
              <div
                key={stat.id}
                className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-3"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={stat.value}
                    onChange={(e) => {
                      const next = [...miniStats]
                      next[index] = { ...next[index], value: e.target.value }
                      setMiniStats(next)
                    }}
                    placeholder={stat.id === "fastResponse" ? "24/7" : "< 1h"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label (RU)</Label>
                  <Input
                    value={stat.label_ru}
                    onChange={(e) => {
                      const next = [...miniStats]
                      next[index] = { ...next[index], label_ru: e.target.value }
                      setMiniStats(next)
                    }}
                    placeholder={stat.id === "fastResponse" ? "Быстрый ответ" : "Поддержка"}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label (EN)</Label>
                  <Input
                    value={stat.label_en}
                    onChange={(e) => {
                      const next = [...miniStats]
                      next[index] = { ...next[index], label_en: e.target.value }
                      setMiniStats(next)
                    }}
                    placeholder={stat.id === "fastResponse" ? "Fast response" : "Support"}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-end gap-2">
            {validationError && (
              <p
                className="w-full text-sm text-destructive"
                role="alert"
              >
                {validationError}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!initialContact) return
                  void loadContact(context)
                }}
                disabled={!initialContact}
              >
                Отменить
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
