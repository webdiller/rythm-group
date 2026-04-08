"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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

type AffiliateFormat = {
  id: number
  title_ru: string
  title_en: string
  body_ru: string
  body_en: string
  hidden: boolean | null
  order_index: number | null
}

type AffiliateFaq = {
  id: number
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  hidden: boolean | null
  order_index: number | null
}

export function AffiliateContentEditor() {
  const [hero, setHero] = useState<AffiliateHero | null>(null)
  const [formats, setFormats] = useState<AffiliateFormat[]>([])
  const [faq, setFaq] = useState<AffiliateFaq[]>([])
  const [sections, setSections] = useState({
    affiliate_show_hero: true,
    affiliate_show_formats: true,
    affiliate_show_cases: true,
    affiliate_show_steam: true,
    affiliate_show_faq: true,
  })
  const [savingSections, setSavingSections] = useState(false)
  const [savingHero, setSavingHero] = useState(false)
  const [savingFormatId, setSavingFormatId] = useState<number | null>(null)
  const [deletingFormatId, setDeletingFormatId] = useState<number | null>(null)
  const [addingFormat, setAddingFormat] = useState(false)
  const [savingFaqId, setSavingFaqId] = useState<number | null>(null)
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null)
  const [addingFaq, setAddingFaq] = useState(false)

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const load = async () => {
    try {
      const [heroRes, formatsRes, faqRes, settingsRes] = await Promise.all([
        fetch("/api/content/affiliate-hero"),
        fetch("/api/content/affiliate-formats"),
        fetch("/api/content/affiliate-faq"),
        fetch("/api/site/settings"),
      ])
      const heroJson = (await heroRes.json()) as { data?: AffiliateHero | null }
      const formatsJson = (await formatsRes.json()) as { data?: AffiliateFormat[] }
      const faqJson = (await faqRes.json()) as { data?: AffiliateFaq[] }
      const settingsJson = (await settingsRes.json()) as {
        data?: {
          affiliate_show_hero?: boolean | null
          affiliate_show_formats?: boolean | null
          affiliate_show_cases?: boolean | null
          affiliate_show_steam?: boolean | null
          affiliate_show_faq?: boolean | null
        } | null
      }
      setHero(heroJson.data ?? null)
      setFormats((formatsJson.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
      setFaq((faqJson.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
      const s = settingsJson.data
      setSections({
        affiliate_show_hero: s?.affiliate_show_hero ?? true,
        affiliate_show_formats: s?.affiliate_show_formats ?? true,
        affiliate_show_cases: s?.affiliate_show_cases ?? true,
        affiliate_show_steam: s?.affiliate_show_steam ?? true,
        affiliate_show_faq: s?.affiliate_show_faq ?? true,
      })
    } catch {
      toast.error("Не удалось загрузить данные Affiliate")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveSections = async () => {
    if (savingSections) return
    setSavingSections(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(sections),
      })
      if (!res.ok) {
        alert("Не удалось сохранить секции")
        return toast.error("Не удалось сохранить секции")
      }
      toast.success("Секции Affiliate обновлены")
    } catch {
      alert("Не удалось сохранить секции")
      toast.error("Не удалось сохранить секции")
    } finally {
      setSavingSections(false)
    }
  }

  const saveHero = async () => {
    if (!hero || savingHero) return
    setSavingHero(true)
    try {
      const token = getToken()
      const res = await fetch("/api/content/affiliate-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(hero),
      })
      if (!res.ok) {
        alert("Не удалось сохранить Hero")
        return toast.error("Не удалось сохранить Hero")
      }
      toast.success("Hero Affiliate обновлён")
    } catch {
      alert("Не удалось сохранить Hero")
      toast.error("Не удалось сохранить Hero")
    } finally {
      setSavingHero(false)
    }
  }

  const upsertFormat = async (item: Partial<AffiliateFormat>) => {
    const token = getToken()
    const method = item.id ? "PUT" : "POST"
    const res = await fetch("/api/content/affiliate-formats", {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("save format failed")
  }

  const upsertFaq = async (item: Partial<AffiliateFaq>) => {
    const token = getToken()
    const method = item.id ? "PUT" : "POST"
    const res = await fetch("/api/content/affiliate-faq", {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("save faq failed")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Affiliate: отображение секций</CardTitle></CardHeader>
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
                checked={sections[key as keyof typeof sections]}
                onCheckedChange={(v) => setSections((prev) => ({ ...prev, [key]: v }))}
              />
            </div>
          ))}
          <div className="flex justify-end">
            <Button onClick={saveSections} disabled={savingSections}>
              {savingSections ? "Сохранение..." : "Сохранить секции"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Affiliate Hero</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {hero ? (
            <>
              <Input value={hero.badge_ru} onChange={(e) => setHero({ ...hero, badge_ru: e.target.value })} placeholder="Badge RU" />
              <Input value={hero.badge_en} onChange={(e) => setHero({ ...hero, badge_en: e.target.value })} placeholder="Badge EN" />
              <Input value={hero.title_ru} onChange={(e) => setHero({ ...hero, title_ru: e.target.value })} placeholder="Title RU" />
              <Input value={hero.title_en} onChange={(e) => setHero({ ...hero, title_en: e.target.value })} placeholder="Title EN" />
              <Textarea value={hero.subtitle_ru} onChange={(e) => setHero({ ...hero, subtitle_ru: e.target.value })} placeholder="Subtitle RU" />
              <Textarea value={hero.subtitle_en} onChange={(e) => setHero({ ...hero, subtitle_en: e.target.value })} placeholder="Subtitle EN" />
              <Input value={hero.cta_primary_ru} onChange={(e) => setHero({ ...hero, cta_primary_ru: e.target.value })} placeholder="CTA primary RU" />
              <Input value={hero.cta_primary_en} onChange={(e) => setHero({ ...hero, cta_primary_en: e.target.value })} placeholder="CTA primary EN" />
              <Input value={hero.cta_secondary_ru} onChange={(e) => setHero({ ...hero, cta_secondary_ru: e.target.value })} placeholder="CTA secondary RU" />
              <Input value={hero.cta_secondary_en} onChange={(e) => setHero({ ...hero, cta_secondary_en: e.target.value })} placeholder="CTA secondary EN" />
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={saveHero} disabled={savingHero}>
                  {savingHero ? "Сохранение..." : "Сохранить Hero"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Форматы сотрудничества</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {formats.map((item) => (
            <div key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-2">
              <Input value={item.title_ru} onChange={(e) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, title_ru: e.target.value } : x))} placeholder="Title RU" />
              <Input value={item.title_en} onChange={(e) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, title_en: e.target.value } : x))} placeholder="Title EN" />
              <Textarea value={item.body_ru} onChange={(e) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, body_ru: e.target.value } : x))} placeholder="Body RU" />
              <Textarea value={item.body_en} onChange={(e) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, body_en: e.target.value } : x))} placeholder="Body EN" />
              <div className="flex items-center gap-2">
                <Label>Скрыть</Label>
                <Switch checked={!!item.hidden} onCheckedChange={(v) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, hidden: v } : x))} />
              </div>
              <Input type="number" value={item.order_index ?? 0} onChange={(e) => setFormats((prev) => prev.map((x) => x.id === item.id ? { ...x, order_index: Number(e.target.value) } : x))} placeholder="Order" />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={deletingFormatId === item.id || savingFormatId === item.id}
                  onClick={async () => {
                    setDeletingFormatId(item.id)
                    const token = getToken()
                    try {
                      const res = await fetch(`/api/content/affiliate-formats?id=${item.id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                      if (!res.ok) {
                        alert("Не удалось удалить формат")
                        return toast.error("Не удалось удалить формат")
                      }
                      toast.success("Формат удалён")
                      void load()
                    } catch {
                      alert("Не удалось удалить формат")
                      toast.error("Не удалось удалить формат")
                    } finally {
                      setDeletingFormatId(null)
                    }
                  }}
                >{deletingFormatId === item.id ? "Удаление..." : "Удалить"}</Button>
                <Button
                  disabled={deletingFormatId === item.id || savingFormatId === item.id}
                  onClick={async () => {
                    setSavingFormatId(item.id)
                    try {
                      await upsertFormat(item); toast.success("Формат обновлён")
                    } catch {
                      alert("Не удалось сохранить формат")
                      toast.error("Не удалось сохранить формат")
                    } finally {
                      setSavingFormatId(null)
                    }
                  }}
                >
                  {savingFormatId === item.id ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button
              disabled={addingFormat}
              onClick={async () => {
                if (addingFormat) return
                setAddingFormat(true)
                try {
                  await upsertFormat({ title_ru: "Новый формат", title_en: "New format", body_ru: "", body_en: "", hidden: false, order_index: formats.length })
                  toast.success("Формат добавлен")
                  void load()
                } catch {
                  alert("Не удалось добавить формат")
                  toast.error("Не удалось добавить формат")
                } finally {
                  setAddingFormat(false)
                }
              }}
            >{addingFormat ? "Добавление..." : "Добавить формат"}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>FAQ Affiliate</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {faq.map((item) => (
            <div key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-2">
              <Input value={item.question_ru} onChange={(e) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, question_ru: e.target.value } : x))} placeholder="Question RU" />
              <Input value={item.question_en} onChange={(e) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, question_en: e.target.value } : x))} placeholder="Question EN" />
              <Textarea value={item.answer_ru} onChange={(e) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, answer_ru: e.target.value } : x))} placeholder="Answer RU" />
              <Textarea value={item.answer_en} onChange={(e) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, answer_en: e.target.value } : x))} placeholder="Answer EN" />
              <div className="flex items-center gap-2">
                <Label>Скрыть</Label>
                <Switch checked={!!item.hidden} onCheckedChange={(v) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, hidden: v } : x))} />
              </div>
              <Input type="number" value={item.order_index ?? 0} onChange={(e) => setFaq((prev) => prev.map((x) => x.id === item.id ? { ...x, order_index: Number(e.target.value) } : x))} placeholder="Order" />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={deletingFaqId === item.id || savingFaqId === item.id}
                  onClick={async () => {
                    setDeletingFaqId(item.id)
                    const token = getToken()
                    try {
                      const res = await fetch(`/api/content/affiliate-faq?id=${item.id}`, { method: "DELETE", headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                      if (!res.ok) {
                        alert("Не удалось удалить FAQ")
                        return toast.error("Не удалось удалить FAQ")
                      }
                      toast.success("FAQ удалён")
                      void load()
                    } catch {
                      alert("Не удалось удалить FAQ")
                      toast.error("Не удалось удалить FAQ")
                    } finally {
                      setDeletingFaqId(null)
                    }
                  }}
                >{deletingFaqId === item.id ? "Удаление..." : "Удалить"}</Button>
                <Button
                  disabled={deletingFaqId === item.id || savingFaqId === item.id}
                  onClick={async () => {
                    setSavingFaqId(item.id)
                    try {
                      await upsertFaq(item); toast.success("FAQ обновлён")
                    } catch {
                      alert("Не удалось сохранить FAQ")
                      toast.error("Не удалось сохранить FAQ")
                    } finally {
                      setSavingFaqId(null)
                    }
                  }}
                >
                  {savingFaqId === item.id ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button
              disabled={addingFaq}
              onClick={async () => {
                if (addingFaq) return
                setAddingFaq(true)
                try {
                  await upsertFaq({ question_ru: "Новый вопрос", question_en: "New question", answer_ru: "", answer_en: "", hidden: false, order_index: faq.length })
                  toast.success("FAQ добавлен")
                  void load()
                } catch {
                  alert("Не удалось добавить FAQ")
                  toast.error("Не удалось добавить FAQ")
                } finally {
                  setAddingFaq(false)
                }
              }}
            >{addingFaq ? "Добавление..." : "Добавить FAQ"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
