"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type AffiliateSections = {
  affiliate_show_hero: boolean
  affiliate_show_formats: boolean
  affiliate_show_cases: boolean
  affiliate_show_steam: boolean
  affiliate_show_faq: boolean
}

export function AffiliateSectionsEditor() {
  const [sections, setSections] = useState<AffiliateSections>({
    affiliate_show_hero: true,
    affiliate_show_formats: true,
    affiliate_show_cases: true,
    affiliate_show_steam: true,
    affiliate_show_faq: true,
  })

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/site/settings")
        if (!res.ok) return
        const json = (await res.json()) as {
          data?: Partial<AffiliateSections> | null
        }
        const data = json.data ?? {}
        setSections({
          affiliate_show_hero: data.affiliate_show_hero ?? true,
          affiliate_show_formats: data.affiliate_show_formats ?? true,
          affiliate_show_cases: data.affiliate_show_cases ?? true,
          affiliate_show_steam: data.affiliate_show_steam ?? true,
          affiliate_show_faq: data.affiliate_show_faq ?? true,
        })
      } catch {
        toast.error("Не удалось загрузить настройки секций Affiliate")
      }
    }
    void load()
  }, [])

  const save = async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/site/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(sections),
      })
      if (!res.ok) {
        toast.error("Не удалось сохранить настройки секций Affiliate")
        return
      }
      toast.success("Настройки секций Affiliate сохранены")
    } catch {
      toast.error("Не удалось сохранить настройки секций Affiliate")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate: отображение секций</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          ["affiliate_show_hero", "Hero"],
          ["affiliate_show_formats", "Форматы сотрудничества"],
          ["affiliate_show_cases", "Кейсы"],
          ["affiliate_show_steam", "Steam блок"],
          ["affiliate_show_faq", "FAQ"],
        ].map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label>{label}</Label>
            <Switch
              checked={sections[key as keyof AffiliateSections]}
              onCheckedChange={(checked) =>
                setSections((prev) => ({ ...prev, [key]: checked }))
              }
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={save}>Сохранить</Button>
        </div>
      </CardContent>
    </Card>
  )
}
