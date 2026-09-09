"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [saving, setSaving] = useState(false)

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

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
    if (!hero || saving) return
    setSaving(true)
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
    } finally {
      setSaving(false)
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
            <div className="space-y-2">
              <Label htmlFor="aff-hero-badge-ru">Badge RU</Label>
              <Input
                id="aff-hero-badge-ru"
                value={hero.badge_ru}
                onChange={(e) => setHero({ ...hero, badge_ru: e.target.value })}
                placeholder="Badge RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-badge-en">Badge EN</Label>
              <Input
                id="aff-hero-badge-en"
                value={hero.badge_en}
                onChange={(e) => setHero({ ...hero, badge_en: e.target.value })}
                placeholder="Badge EN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-title-ru">Title RU</Label>
              <Input
                id="aff-hero-title-ru"
                value={hero.title_ru}
                onChange={(e) => setHero({ ...hero, title_ru: e.target.value })}
                placeholder="Title RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-title-en">Title EN</Label>
              <Input
                id="aff-hero-title-en"
                value={hero.title_en}
                onChange={(e) => setHero({ ...hero, title_en: e.target.value })}
                placeholder="Title EN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-subtitle-ru">Subtitle RU</Label>
              <Input
                id="aff-hero-subtitle-ru"
                value={hero.subtitle_ru}
                onChange={(e) => setHero({ ...hero, subtitle_ru: e.target.value })}
                placeholder="Subtitle RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-subtitle-en">Subtitle EN</Label>
              <Input
                id="aff-hero-subtitle-en"
                value={hero.subtitle_en}
                onChange={(e) => setHero({ ...hero, subtitle_en: e.target.value })}
                placeholder="Subtitle EN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-cta-primary-ru">CTA primary RU</Label>
              <Input
                id="aff-hero-cta-primary-ru"
                value={hero.cta_primary_ru}
                onChange={(e) => setHero({ ...hero, cta_primary_ru: e.target.value })}
                placeholder="CTA primary RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-cta-primary-en">CTA primary EN</Label>
              <Input
                id="aff-hero-cta-primary-en"
                value={hero.cta_primary_en}
                onChange={(e) => setHero({ ...hero, cta_primary_en: e.target.value })}
                placeholder="CTA primary EN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-cta-secondary-ru">CTA secondary RU</Label>
              <Input
                id="aff-hero-cta-secondary-ru"
                value={hero.cta_secondary_ru}
                onChange={(e) => setHero({ ...hero, cta_secondary_ru: e.target.value })}
                placeholder="CTA secondary RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aff-hero-cta-secondary-en">CTA secondary EN</Label>
              <Input
                id="aff-hero-cta-secondary-en"
                value={hero.cta_secondary_en}
                onChange={(e) => setHero({ ...hero, cta_secondary_en: e.target.value })}
                placeholder="CTA secondary EN"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={save}
                disabled={saving}
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        )}
      </CardContent>
    </Card>
  )
}
