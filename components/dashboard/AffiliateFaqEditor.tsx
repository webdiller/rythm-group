"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type AffiliateFaq = {
  id: number
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  hidden: boolean | null
  order_index: number | null
}

export function AffiliateFaqEditor() {
  const [items, setItems] = useState<AffiliateFaq[]>([])

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const load = async () => {
    try {
      const res = await fetch("/api/content/affiliate-faq")
      if (!res.ok) return
      const json = (await res.json()) as { data?: AffiliateFaq[] }
      setItems((json.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
    } catch {
      toast.error("Не удалось загрузить FAQ Affiliate")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveOne = async (item: Partial<AffiliateFaq>) => {
    const token = getToken()
    const method = item.id ? "PUT" : "POST"
    const res = await fetch("/api/content/affiliate-faq", {
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
        <CardTitle>Affiliate: FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded border p-3 md:grid-cols-2">
            <Input value={item.question_ru} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, question_ru: e.target.value } : x))} placeholder="Question RU" />
            <Input value={item.question_en} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, question_en: e.target.value } : x))} placeholder="Question EN" />
            <Textarea value={item.answer_ru} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, answer_ru: e.target.value } : x))} placeholder="Answer RU" />
            <Textarea value={item.answer_en} onChange={(e) => setItems((prev) => prev.map((x) => x.id === item.id ? { ...x, answer_en: e.target.value } : x))} placeholder="Answer EN" />
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
                  const res = await fetch(`/api/content/affiliate-faq?id=${item.id}`, {
                    method: "DELETE",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                  })
                  if (!res.ok) return toast.error("Не удалось удалить FAQ")
                  toast.success("FAQ удалён")
                  void load()
                }}
              >
                Удалить
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await saveOne(item)
                    toast.success("FAQ сохранён")
                  } catch {
                    toast.error("Не удалось сохранить FAQ")
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
                  question_ru: "Новый вопрос",
                  question_en: "New question",
                  answer_ru: "",
                  answer_en: "",
                  hidden: false,
                  order_index: items.length,
                })
                toast.success("FAQ добавлен")
                void load()
              } catch {
                toast.error("Не удалось добавить FAQ")
              }
            }}
          >
            Добавить FAQ
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
