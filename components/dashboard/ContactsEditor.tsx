"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Contact {
  id: number
  email: string
  telegram_url: string
  telegram_username: string
  direct_contacts?: string | null
}

type DirectContactLink = {
  id: string
  label: string
  url: string
  description?: string
  type: "telegram" | "email" | "instagram" | "max" | "other"
}

export function ContactsEditor() {
  const [contact, setContact] = useState<Contact>({
    id: 0,
    email: "",
    telegram_url: "",
    telegram_username: "",
  })
  const [initialContact, setInitialContact] = useState<Contact | null>(null)
  const [directContacts, setDirectContacts] = useState<DirectContactLink[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadContact()
  }, [])

  const loadContact = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/content/contacts")
      if (response.ok) {
        const json = (await response.json()) as { data?: Contact[] }
        const loaded: Contact =
          json.data?.[0] ?? { id: 0, email: "", telegram_url: "", telegram_username: "", direct_contacts: null }

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
                  const label = typeof raw.label === "string" ? raw.label : ""
                  if (!url || !label) return null
                  const id =
                    typeof raw.id === "string" && raw.id.length > 0
                      ? raw.id
                      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                  const description = typeof raw.description === "string" ? raw.description : undefined
                  const typeValue = typeof raw.type === "string" ? raw.type : "other"
                  const type: DirectContactLink["type"] =
                    typeValue === "telegram" || typeValue === "email" || typeValue === "instagram" || typeValue === "max"
                      ? typeValue
                      : "other"
                  return { id, label, url, description, type }
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
      }
    } catch (error) {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
      const isCreate = !contact.id
      const payload: Contact = {
        ...contact,
        direct_contacts: directContacts.length ? JSON.stringify(directContacts) : null,
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
          loadContact()
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
            <Label htmlFor="email">Email(s)</Label>
            <Input
              id="email"
              type="text"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              placeholder="admin1@example.com, admin2@example.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Укажите одну или несколько почт через запятую — на них будут приходить заявки с формы контактов.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Добавьте ссылки на социальные сети, которые будут отображаться в блоке &quot;Связаться напрямую&quot;:
              Telegram, email, Instagram, MAX и любые другие.
            </p>
            <div className="space-y-3">
              {directContacts.map((link, index) => (
                <div
                  key={link.id}
                  className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-[1.2fr,1.8fr,auto]"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], label: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="Написать в Telegram"
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
                    <Label className="text-xs">Type</Label>
                    <Input
                      value={link.type}
                      onChange={(e) => {
                        const value = e.target.value as DirectContactLink["type"]
                        const next = [...directContacts]
                        next[index] = {
                          ...next[index],
                          type: (["telegram", "email", "instagram", "max", "other"] as const).includes(value)
                            ? value
                            : "other",
                        }
                        setDirectContacts(next)
                      }}
                      placeholder="telegram / email / instagram / max / other"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs">Description (optional)</Label>
                    <Input
                      value={link.description ?? ""}
                      onChange={(e) => {
                        const next = [...directContacts]
                        next[index] = { ...next[index], description: e.target.value }
                        setDirectContacts(next)
                      }}
                      placeholder="@RythmGroup"
                    />
                  </div>
                  <div className="flex items-end justify-end md:col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDirectContacts((prev) => prev.filter((_, i) => i !== index))
                      }
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
                      label: "",
                      url: "",
                      type: "telegram",
                    },
                  ])
                }
              >
                Добавить ссылку
              </Button>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => initialContact && setContact(initialContact)}
              disabled={!initialContact}>
              Отменить
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
