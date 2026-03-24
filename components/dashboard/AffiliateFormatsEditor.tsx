"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type AffiliateFormat = {
  id: number
  title_ru: string
  title_en: string
  body_ru: string
  body_en: string
  hidden: boolean | null
  order_index: number | null
}

export function AffiliateFormatsEditor() {
  const [items, setItems] = useState<AffiliateFormat[]>([])

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const load = async () => {
    try {
      const res = await fetch("/api/content/affiliate-formats")
      if (!res.ok) return
      const json = (await res.json()) as { data?: AffiliateFormat[] }
      setItems((json.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
    } catch {
      toast.error("Не удалось загрузить форматы сотрудничества")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveOne = async (item: Partial<AffiliateFormat>) => {
    const token = getToken()
    const method = item.id ? "PUT" : "POST"
    const res = await fetch("/api/content/affiliate-formats", {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("save failed")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate: форматы сотрудничества</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-2">
            <Input value={item.title_ru} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, title_ru: e.target.value } : x))} placeholder="Title RU" />
            <Input value={item.title_en} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, title_en: e.target.value } : x))} placeholder="Title EN" />
            <Textarea value={item.body_ru} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, body_ru: e.target.value } : x))} placeholder="Body RU" />
            <Textarea value={item.body_en} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, body_en: e.target.value } : x))} placeholder="Body EN" />
            <div className="flex items-center gap-2">
              <Label>Скрыть</Label>
              <Switch checked={!!item.hidden} onCheckedChange={(checked) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, hidden: checked } : x))} />
            </div>
            <Input type="number" value={item.order_index ?? 0} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, order_index: Number(e.target.value) } : x))} placeholder="Order" />
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  const token = getToken()
                  const res = await fetch(`/api/content/affiliate-formats?id=${item.id}`, {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                  })
                  if (!res.ok) return toast.error("Не удалось удалить формат")
                  toast.success("Формат удалён")
                  void load()
                }}
              >
                Удалить
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await saveOne(item)
                    toast.success("Формат сохранён")
                  } catch {
                    toast.error("Не удалось сохранить формат")
                  }
                }}
              >
                Сохранить
              </Button>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button
            onClick={async () => {
              try {
                await saveOne({
                  title_ru: "Новый формат",
                  title_en: "New format",
                  body_ru: "",
                  body_en: "",
                  hidden: false,
                  order_index: items.length,
                })
                toast.success("Формат добавлен")
                void load()
              } catch {
                toast.error("Не удалось добавить формат")
              }
            }}
          >
            Добавить формат
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
