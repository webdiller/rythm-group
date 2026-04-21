"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const sections = ["hero", "about", "stats", "channels", "cases", "contact", "nav", "footer", "blog", "affiliate"]
const locales = ["ru", "en"]

type TranslationRow = { id?: number; value: string }

export function TranslationsEditor() {
  const [selectedLocale, setSelectedLocale] = useState<"ru" | "en">("ru")
  const [selectedSection, setSelectedSection] = useState(sections[0])
  const [translations, setTranslations] = useState<Record<string, TranslationRow>>({})
  const [savedTranslations, setSavedTranslations] = useState<Record<string, TranslationRow>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTranslations()
  }, [selectedLocale, selectedSection])

  const loadTranslations = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/content/translations?locale=${selectedLocale}&section=${selectedSection}`
      )
      if (response.ok) {
        const json = (await response.json()) as {
          data?: Array<{ id: number; locale: string; section: string; key: string; value: string | null }>
        }
        const data = json.data ?? []
        const map: Record<string, TranslationRow> = {}
        data.forEach((item) => {
          map[item.key] = { id: item.id, value: item.value ?? "" }
        })
        setTranslations(map)
        setSavedTranslations(map)
      }
    } catch (error) {
      toast.error("Failed to load translations")
    } finally {
      setLoading(false)
    }
  }

  const saveOneTranslation = async (key: string, value: string): Promise<boolean> => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

    const existingId = translations[key]?.id
    const method = existingId != null ? "PUT" : "POST"
    const body =
      existingId != null
        ? { id: existingId, locale: selectedLocale, section: selectedSection, key, value }
        : { locale: selectedLocale, section: selectedSection, key, value }

    const response = await fetch("/api/content/translations", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (response.ok) {
      const resJson = (await response.json()) as { data?: { id: number; value: string | null } }
      setTranslations((prev) => ({
        ...prev,
        [key]: { id: resJson.data?.id ?? existingId, value },
      }))
      return true
    }
    const err = (await response.json()) as { error?: string }
    toast.error(err.error ?? "Failed to save translation")
    return false
  }

  const getChangedKeys = (): string[] => {
    const keys = new Set([...Object.keys(translations), ...Object.keys(savedTranslations)])
    return Array.from(keys).filter(
      (key) => (translations[key]?.value ?? "") !== (savedTranslations[key]?.value ?? "")
    )
  }

  const hasChanges = getChangedKeys().length > 0

  const handleSave = async () => {
    const changedKeys = getChangedKeys()
    if (changedKeys.length === 0) return
    setSaving(true)
    try {
      let ok = true
      for (const key of changedKeys) {
        const success = await saveOneTranslation(key, translations[key]?.value ?? "")
        if (!success) ok = false
      }
      if (ok) {
        setSavedTranslations((prev) => {
          const next = { ...prev }
          changedKeys.forEach((key) => {
            next[key] = { ...translations[key], value: translations[key]?.value ?? "" }
          })
          return next
        })
        toast.success("Translations saved")
      }
    } catch (error) {
      toast.error("Failed to save translations")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTranslations({ ...savedTranslations })
  }

  const handleChange = (key: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [key]: { ...prev[key], value } }))
  }

  const parseStatsItems = (
    raw: string
  ): Array<{ value: string; label: string }> => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => ({
        value: typeof item?.value === "string" ? item.value : "",
        label: typeof item?.label === "string" ? item.label : "",
      }))
    } catch {
      return []
    }
  }

  const parseBudgetOptions = (raw: string): string[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => (typeof item === "string" ? item : ""))
    } catch {
      return []
    }
  }

  const getNestedKeys = (section: string): string[] => {
    // Generate keys based on section structure
    const keysMap: Record<string, string[]> = {
      hero: ["title", "subtitle", "badge", "cta", "scroll"],
      nav: ["about", "channels", "cases", "affiliate", "blog", "contacts", "order"],
      about: ["title", "subtitle", "mission.title", "mission.text", "team.title", "team.text", "audience.title", "audience.text"],
      stats: ["title", "subtitle", "items"],
      channels: ["title", "subtitle", "subscribers", "reach"],
      cases: ["title", "subtitle", "empty"],
      contact: [
        "title",
        "subtitle",
        "name",
        "email",
        "company",
        "message",
        "budget",
        "budgetOptions",
        "submit",
        "or",
        "telegram",
        "emailUs",
        "miniStats.fastResponseValue",
        "miniStats.fastResponseLabel",
        "miniStats.supportValue",
        "miniStats.supportLabel",
      ],
      footer: ["rights", "description", "ctaTitle", "privacy", "dataPolicy"],
      blog: [
        "title",
        "subtitle",
        "breadcrumbHome",
        "allCategories",
        "readMore",
        "backToBlog",
        "emptyAll",
        "dateLabel",
      ],
      affiliate: [
        "formats.title",
        "formats.subtitle",
        "cases.title",
        "cases.subtitle",
        "cases.wishlistsLabel",
        "cases.publishedLabel",
        "cases.openCase",
        "cases.empty",
        "cases.uncategorizedTitle",
        "steam.title",
        "steam.subtitle",
        "steam.openSteam",
        "faq.title",
        "faq.subtitle",
        "miniBlog.title",
        "miniBlog.subtitle",
        "miniBlog.goToBlog",
        "casePage.back",
        "casePage.aboutGame",
        "casePage.socialProof",
        "casePage.timeline",
        "casePage.steamStats",
        "casePage.reactions",
        "casePage.views",
      ],
    }
    return keysMap[section] || []
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={selectedLocale} onValueChange={(value) => setSelectedLocale(value as "ru" | "en")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ru">RU</SelectItem>
            <SelectItem value="en">EN</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section} value={section}>
                {section === "affiliate" ? "Affiliate" : section.charAt(0).toUpperCase() + section.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Edit Translations</CardTitle>
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {getNestedKeys(selectedSection).map((key) => {
            if (selectedSection === "stats" && key === "items") {
              const items = parseStatsItems(translations[key]?.value ?? "")

              const updateItems = (nextItems: Array<{ value: string; label: string }>) => {
                handleChange(key, JSON.stringify(nextItems, null, 2))
              }

              return (
                <div key={key} className="space-y-2">
                  <Label>{key}</Label>
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="space-y-3">
                          <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex-1 space-y-1">
                              <Label htmlFor={`${key}-value-${index}`}>value</Label>
                              <Input
                                id={`${key}-value-${index}`}
                                value={item.value}
                                onChange={(e) => {
                                  const next = [...items]
                                  next[index] = { ...next[index], value: e.target.value }
                                  updateItems(next)
                                }}
                              />
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label htmlFor={`${key}-label-${index}`}>label</Label>
                              <Input
                                id={`${key}-label-${index}`}
                                value={item.label}
                                onChange={(e) => {
                                  const next = [...items]
                                  next[index] = { ...next[index], label: e.target.value }
                                  updateItems(next)
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const next = items.filter((_, i) => i !== index)
                                updateItems(next)
                              }}
                            >
                              Удалить item
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = [...items, { value: "", label: "" }]
                        updateItems(next)
                      }}
                    >
                      Добавить item
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Элементы будут сохранены как JSON-массив объектов с полями
                      {" "}
                      <code>value</code> и <code>label</code>.
                    </p>
                  </div>
                </div>
              )
            }

            if (selectedSection === "contact" && key === "budgetOptions") {
              const options = parseBudgetOptions(translations[key]?.value ?? "")

              const updateOptions = (next: string[]) => {
                handleChange(key, JSON.stringify(next, null, 2))
              }

              return (
                <div key={key} className="space-y-2">
                  <Label>{key}</Label>
                  <div className="space-y-3">
                    {options.map((opt, index) => (
                      <Card key={index}>
                        <CardContent className="flex items-center gap-3">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const next = [...options]
                              next[index] = e.target.value
                              updateOptions(next)
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const next = options.filter((_, i) => i !== index)
                              updateOptions(next)
                            }}
                          >
                            ×
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateOptions([...options, ""])
                      }
                    >
                      Добавить бюджет
                    </Button>
                  </div>
                </div>
              )
            }

            return (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key}</Label>
                <Textarea
                  id={key}
                  value={translations[key]?.value ?? ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  rows={
                    key.includes("text") || key.includes("subtitle") || key === "pageDescription" ? 3 : 1
                  }
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
