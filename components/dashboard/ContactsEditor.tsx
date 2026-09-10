"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import type { ContactIconItem } from "@/lib/schemas/contact-icons"
import {
  DEFAULT_ICON_FILTERS,
  iconFiltersToCss,
  type IconCssFilters,
} from "@/lib/contact-icons/filters"
import {
  parseDirectContactLinks,
  serializeDirectContactLinks,
  type DirectContactLink,
} from "@/lib/contact-icons/direct-contact"
import { getContactIconSrc } from "@/lib/s3/contact-icon-url"
import { IconFilterEditor } from "@/components/dashboard/icon-filter-editor"

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

type MiniStatItem = {
  id: "fastResponse" | "support"
  value: string
  label_ru: string
  label_en: string
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
  const [icons, setIcons] = useState<ContactIconItem[]>([])
  const [iconQuery, setIconQuery] = useState("")
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [filterIndex, setFilterIndex] = useState<number | null>(null)
  const [miniStats, setMiniStats] = useState<MiniStatItem[]>([
    { id: "fastResponse", value: "", label_ru: "", label_en: "" },
    { id: "support", value: "", label_ru: "", label_en: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const iconsById = useMemo(() => {
    const map = new Map<number, ContactIconItem>()
    for (const icon of icons) map.set(icon.id, icon)
    return map
  }, [icons])

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase()
    if (!q) return icons
    return icons.filter((i) => i.name.toLowerCase().includes(q))
  }, [icons, iconQuery])

  useEffect(() => {
    void loadContact(context)
  }, [context])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/content/contact-icons")
        if (!res.ok) return
        const json = (await res.json()) as { data?: ContactIconItem[] }
        setIcons(json.data ?? [])
      } catch {
        /* ignore */
      }
    })()
  }, [])

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
        setDirectContacts(parseDirectContactLinks(loaded.direct_contacts))

        if (loaded.mini_stats) {
          try {
            const parsed = JSON.parse(loaded.mini_stats) as unknown
            if (Array.isArray(parsed) && parsed.length >= 2) {
              setMiniStats(
                parsed.slice(0, 2).map((item, i) => {
                  const raw = item as Record<string, unknown>
                  return {
                    id: i === 0 ? "fastResponse" : "support",
                    value: typeof raw.value === "string" ? raw.value : "",
                    label_ru: typeof raw.label_ru === "string" ? raw.label_ru : "",
                    label_en: typeof raw.label_en === "string" ? raw.label_en : "",
                  }
                }) as MiniStatItem[],
              )
            }
          } catch {
            /* keep defaults */
          }
        }
      }
    } catch {
      toast.error("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }

  const assignIcon = (linkIndex: number, icon: ContactIconItem | null) => {
    setDirectContacts((prev) => {
      const next = [...prev]
      if (!icon) {
        next[linkIndex] = {
          ...next[linkIndex],
          icon_id: null,
          filter_light: null,
          filter_dark: null,
        }
      } else {
        next[linkIndex] = {
          ...next[linkIndex],
          icon_id: icon.id,
          filter_light: { ...icon.filter_light },
          filter_dark: icon.filter_dark ? { ...icon.filter_dark } : null,
        }
      }
      return next
    })
    setPickerIndex(null)
    setIconQuery("")
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
        direct_contacts: serializeDirectContactLinks(directContacts),
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
    } catch {
      toast.error("Failed to save contacts")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-8 text-center">Loading...</div>
  }

  const filterLink = filterIndex != null ? directContacts[filterIndex] : null
  const filterLibIcon =
    filterLink?.icon_id != null ? iconsById.get(filterLink.icon_id) : undefined
  const filterSrc = filterLibIcon
    ? getContactIconSrc(filterLibIcon.s3_key, {
        cacheBust: filterLibIcon.updated_at ?? filterLibIcon.id,
      })
    : null

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
            <p className="text-xs text-muted-foreground">
              Контакты для главной и страницы Affiliate редактируются отдельно.
            </p>
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
            <p className="text-xs text-muted-foreground">
              Укажите одну или несколько почт через запятую — на них будут приходить заявки с формы
              контактов.
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
              Иконки выбираются из библиотеки (вкладка «Иконки»). Можно задать фильтры для светлой и
              тёмной темы.
            </p>
            <div className="space-y-3">
              {directContacts.map((link, index) => {
                const lib = link.icon_id != null ? iconsById.get(link.icon_id) : undefined
                const src = lib
                  ? getContactIconSrc(lib.s3_key, { cacheBust: lib.updated_at ?? lib.id })
                  : null
                const lightF = link.filter_light ?? lib?.filter_light ?? DEFAULT_ICON_FILTERS
                const darkF =
                  link.filter_dark ?? lib?.filter_dark ?? link.filter_light ?? lib?.filter_light ?? DEFAULT_ICON_FILTERS

                return (
                  <div
                    key={link.id}
                    className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-2"
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
                    <div className="space-y-1 md:col-span-2">
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
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Иконка</Label>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            {src ? (
                              <img
                                src={src}
                                alt=""
                                className="h-8 w-8 object-contain"
                                style={{ filter: iconFiltersToCss(lightF) }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Светлая</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            {src ? (
                              <img
                                src={src}
                                alt=""
                                className="h-8 w-8 object-contain"
                                style={{ filter: iconFiltersToCss(darkF) }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">Тёмная</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPickerIndex(index)}
                          >
                            {lib ? lib.name : "Выбрать из библиотеки"}
                          </Button>
                          {link.icon_id != null ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setFilterIndex(index)}
                              >
                                Фильтры светлая/тёмная
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => assignIcon(index, null)}
                              >
                                Сбросить
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
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
                    <div className="flex justify-end md:col-span-2">
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
                )
              })}
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
                      icon_id: null,
                      filter_light: null,
                      filter_dark: null,
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
              <p className="w-full text-sm text-destructive" role="alert">
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
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pickerIndex != null} onOpenChange={(open) => !open && setPickerIndex(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Выбор иконки</DialogTitle>
          </DialogHeader>
          <Input
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            placeholder="Поиск по названию…"
          />
          {filteredIcons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Библиотека пуста. Загрузите иконки во вкладке «Иконки».
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {filteredIcons.map((icon) => {
                const src = getContactIconSrc(icon.s3_key, {
                  cacheBust: icon.updated_at ?? icon.id,
                })
                return (
                  <button
                    key={icon.id}
                    type="button"
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 hover:border-primary"
                    onClick={() => pickerIndex != null && assignIcon(pickerIndex, icon)}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded bg-muted">
                      {src ? (
                        <img
                          src={src}
                          alt=""
                          className="h-10 w-10 object-contain"
                          style={{ filter: iconFiltersToCss(icon.filter_light) }}
                        />
                      ) : null}
                    </div>
                    <span className="w-full truncate text-center text-[11px]">{icon.name}</span>
                  </button>
                )
              })}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPickerIndex(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={filterIndex != null} onOpenChange={(open) => !open && setFilterIndex(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Фильтры иконки</DialogTitle>
          </DialogHeader>
          {filterLink && filterIndex != null ? (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Меняется только сама иконка. Фон превью одинаковый.
              </p>
              <div className="flex items-end justify-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
                    {filterSrc ? (
                      <img
                        src={filterSrc}
                        alt=""
                        className="h-12 w-12 object-contain"
                        style={{
                          filter: iconFiltersToCss(
                            filterLink.filter_light ??
                              filterLibIcon?.filter_light ??
                              DEFAULT_ICON_FILTERS,
                          ),
                        }}
                      />
                    ) : null}
                  </div>
                  <span className="text-xs font-medium">Светлая</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
                    {filterSrc ? (
                      <img
                        src={filterSrc}
                        alt=""
                        className="h-12 w-12 object-contain"
                        style={{
                          filter: iconFiltersToCss(
                            filterLink.filter_dark ??
                              filterLibIcon?.filter_dark ??
                              filterLink.filter_light ??
                              filterLibIcon?.filter_light ??
                              DEFAULT_ICON_FILTERS,
                          ),
                        }}
                      />
                    ) : null}
                  </div>
                  <span className="text-xs font-medium">Тёмная</span>
                  {filterLink.filter_dark == null ? (
                    <span className="text-[10px] text-muted-foreground">= как светлая</span>
                  ) : null}
                </div>
              </div>
              <Tabs defaultValue="light">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="light">Фильтры: светлая</TabsTrigger>
                  <TabsTrigger value="dark">Фильтры: тёмная</TabsTrigger>
                </TabsList>
                <TabsContent value="light" className="mt-3">
                  <IconFilterEditor
                    value={
                      filterLink.filter_light ?? filterLibIcon?.filter_light ?? DEFAULT_ICON_FILTERS
                    }
                    onChange={(next: IconCssFilters) => {
                      const copy = [...directContacts]
                      copy[filterIndex] = { ...copy[filterIndex], filter_light: next }
                      setDirectContacts(copy)
                    }}
                  />
                </TabsContent>
                <TabsContent value="dark" className="mt-3 space-y-2">
                  <IconFilterEditor
                    value={
                      filterLink.filter_dark ??
                      filterLink.filter_light ??
                      filterLibIcon?.filter_light ??
                      DEFAULT_ICON_FILTERS
                    }
                    onChange={(next: IconCssFilters) => {
                      const copy = [...directContacts]
                      copy[filterIndex] = { ...copy[filterIndex], filter_dark: next }
                      setDirectContacts(copy)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={filterLink.filter_dark == null}
                    onClick={() => {
                      const copy = [...directContacts]
                      copy[filterIndex] = { ...copy[filterIndex], filter_dark: null }
                      setDirectContacts(copy)
                    }}
                  >
                    Использовать те же фильтры, что у светлой
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" onClick={() => setFilterIndex(null)}>
              Готово
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
