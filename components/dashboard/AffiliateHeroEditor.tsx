"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type AffiliateHero = {
  badge_ru: string
  badge_en: string
  title_ru: string
  title_en: string
  subtitle_ru: string
  subtitle_en: string
  cta_primary_ru: string
  cta_primary_en: string
  cta_secondary_ru: string
  cta_secondary_en: string
}

export function AffiliateHeroEditor() {
  const [hero, setHero] = useState<AffiliateHero | null>(null)

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/content/affiliate-hero")
        if (!res.ok) return
        const json = (await res.json()) as { data?: AffiliateHero | null }
        setHero(json.data ?? null)
      } catch {
        toast.error("Не удалось загрузить Affiliate Hero")
      }
    }
    void load()
  }, [])

  const save = async () => {
    if (!hero) return
    try {
      const token = getToken()
      const res = await fetch("/api/content/affiliate-hero", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(hero),
      })
      if (!res.ok) {
        toast.error("Не удалось сохранить Affiliate Hero")
        return
      }
      toast.success("Affiliate Hero сохранён")
    } catch {
      toast.error("Не удалось сохранить Affiliate Hero")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate Hero</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {hero ? (
          <>
            <Input value={hero.badge_ru} onChange={(e) => setHero({ ...hero, badge_ru: e.target.value })} placeholder="Badge RU" />
            <Input value={hero.badge_en} onChange={(e) => setHero({ ...hero, badge_en: e.target.value })} placeholder="Badge EN" />
            <Input value={hero.title_ru} onChange={(e) => setHero({ ...hero, title_ru: e.target.value })} placeholder="Title RU" />
            <Input value={hero.title_en} onChange={(e) => setHero({ ...hero, title_en: e.target.value })} placeholder="Title EN" />
            <Input value={hero.subtitle_ru} onChange={(e) => setHero({ ...hero, subtitle_ru: e.target.value })} placeholder="Subtitle RU" />
            <Input value={hero.subtitle_en} onChange={(e) => setHero({ ...hero, subtitle_en: e.target.value })} placeholder="Subtitle EN" />
            <Input value={hero.cta_primary_ru} onChange={(e) => setHero({ ...hero, cta_primary_ru: e.target.value })} placeholder="CTA primary RU" />
            <Input value={hero.cta_primary_en} onChange={(e) => setHero({ ...hero, cta_primary_en: e.target.value })} placeholder="CTA primary EN" />
            <Input value={hero.cta_secondary_ru} onChange={(e) => setHero({ ...hero, cta_secondary_ru: e.target.value })} placeholder="CTA secondary RU" />
            <Input value={hero.cta_secondary_en} onChange={(e) => setHero({ ...hero, cta_secondary_en: e.target.value })} placeholder="CTA secondary EN" />
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={save}>Сохранить</Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        )}
      </CardContent>
    </Card>
  )
}
