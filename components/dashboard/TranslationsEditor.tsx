"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const sections = ["hero", "about", "stats", "cases", "contact", "nav", "footer"]
const locales = ["ru", "en"]

type TranslationRow = { id?: number; value: string }

export function TranslationsEditor() {
  const [selectedLocale, setSelectedLocale] = useState<"ru" | "en">("ru")
  const [selectedSection, setSelectedSection] = useState(sections[0])
  const [translations, setTranslations] = useState<Record<string, TranslationRow>>({})
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
      }
    } catch (error) {
      toast.error("Failed to load translations")
    } finally {
      setLoading(false)
    }
  }

  const saveTranslation = async (key: string, value: string) => {
    setSaving(true)
    try {
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
        toast.success("Translation saved")
        const resJson = (await response.json()) as { data?: { id: number; value: string | null } }
        setTranslations((prev) => ({
          ...prev,
          [key]: { id: resJson.data?.id ?? existingId, value },
        }))
      } else {
        const err = (await response.json()) as { error?: string }
        toast.error(err.error ?? "Failed to save translation")
      }
    } catch (error) {
      toast.error("Failed to save translation")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setTranslations((prev) => ({ ...prev, [key]: { ...prev[key], value } }))
    saveTranslation(key, value)
  }

  const getNestedKeys = (section: string): string[] => {
    // Generate keys based on section structure
    const keysMap: Record<string, string[]> = {
      hero: ["title", "subtitle", "cta", "scroll"],
      nav: ["about", "channels", "cases", "contacts", "order"],
      about: ["title", "subtitle", "mission.title", "mission.text", "team.title", "team.text", "audience.title", "audience.text"],
      stats: ["title", "subtitle"],
      cases: ["title", "subtitle"],
      contact: ["title", "subtitle", "name", "email", "company", "message", "budget", "submit", "or", "telegram", "emailUs"],
      footer: ["rights", "description"],
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
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Translations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getNestedKeys(selectedSection).map((key) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{key}</Label>
              <Textarea
                id={key}
                value={translations[key]?.value ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                rows={key.includes("text") ? 3 : 1}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
