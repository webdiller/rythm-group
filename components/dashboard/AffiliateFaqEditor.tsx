"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { GripVertical } from "lucide-react"

type AffiliateFaq = {
  id: number
  question_ru: string
  question_en: string
  answer_ru: string
  answer_en: string
  hidden: boolean | null
  order_index: number | null
}

function SortableList({ items, children }: { items: string[]; children: ReactNode }) {
  return (
    // @ts-ignore dnd-kit JSX typing mismatch in some envs
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

function SortableFaqCard({
  item,
  onChange,
  onDelete,
  onSave,
}: {
  item: AffiliateFaq
  onChange: (id: number, patch: Partial<AffiliateFaq>) => void
  onDelete: (id: number) => Promise<void>
  onSave: (item: AffiliateFaq) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="grid gap-2 rounded border p-3 md:grid-cols-2">
      <div className="md:col-span-2 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
          aria-label="Перетащить для смены порядка"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">ID: {item.id}</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-faq-question-ru-${item.id}`}>Question RU</Label>
        <Input
          id={`aff-faq-question-ru-${item.id}`}
          value={item.question_ru}
          onChange={(e) => onChange(item.id, { question_ru: e.target.value })}
          placeholder="Question RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-faq-question-en-${item.id}`}>Question EN</Label>
        <Input
          id={`aff-faq-question-en-${item.id}`}
          value={item.question_en}
          onChange={(e) => onChange(item.id, { question_en: e.target.value })}
          placeholder="Question EN"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-faq-answer-ru-${item.id}`}>Answer RU</Label>
        <Textarea
          id={`aff-faq-answer-ru-${item.id}`}
          value={item.answer_ru}
          onChange={(e) => onChange(item.id, { answer_ru: e.target.value })}
          placeholder="Answer RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-faq-answer-en-${item.id}`}>Answer EN</Label>
        <Textarea
          id={`aff-faq-answer-en-${item.id}`}
          value={item.answer_en}
          onChange={(e) => onChange(item.id, { answer_en: e.target.value })}
          placeholder="Answer EN"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`aff-faq-hidden-${item.id}`}>Скрыть</Label>
        <Switch
          id={`aff-faq-hidden-${item.id}`}
          checked={!!item.hidden}
          onCheckedChange={(checked) => onChange(item.id, { hidden: checked })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-faq-order-${item.id}`}>Порядок</Label>
        <Input
          id={`aff-faq-order-${item.id}`}
          type="number"
          value={item.order_index ?? 0}
          onChange={(e) => onChange(item.id, { order_index: Number(e.target.value) })}
          placeholder="Order"
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button variant="outline" onClick={() => void onDelete(item.id)}>
          Удалить
        </Button>
        <Button onClick={() => void onSave(item)}>Сохранить</Button>
      </div>
    </div>
  )
}

export function AffiliateFaqEditor() {
  const [items, setItems] = useState<AffiliateFaq[]>([])
  const [savingOrder, setSavingOrder] = useState(false)

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  const persistOrder = async (ordered: AffiliateFaq[]) => {
    const token = getToken()
    const results = await Promise.all(
      ordered.map((item, i) =>
        fetch("/api/content/affiliate-faq", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ id: item.id, order_index: i }),
        }),
      ),
    )
    if (results.some((r) => !r.ok)) throw new Error("order save failed")
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((x) => String(x.id) === String(active.id))
    const newIndex = items.findIndex((x) => String(x.id) === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order_index: index,
    }))
    setItems(reordered)
    setSavingOrder(true)
    try {
      await persistOrder(reordered)
      toast.success("Порядок сохранён")
    } catch {
      toast.error("Не удалось сохранить порядок")
      void load()
    } finally {
      setSavingOrder(false)
    }
  }

  const updateItem = (id: number, patch: Partial<AffiliateFaq>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const deleteItem = async (id: number) => {
    const token = getToken()
    const res = await fetch(`/api/content/affiliate-faq?id=${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!res.ok) {
      toast.error("Не удалось удалить FAQ")
      return
    }
    toast.success("FAQ удалён")
    void load()
  }

  const saveItem = async (item: AffiliateFaq) => {
    try {
      await saveOne(item)
      toast.success("FAQ сохранён")
    } catch {
      toast.error("Не удалось сохранить FAQ")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate: FAQ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Перетащите карточки за иконку слева для смены порядка.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableList items={items.map((x) => String(x.id))}>
            <div className="space-y-3">
              {items.map((item) => (
                <SortableFaqCard
                  key={item.id}
                  item={item}
                  onChange={updateItem}
                  onDelete={deleteItem}
                  onSave={saveItem}
                />
              ))}
            </div>
          </SortableList>
        </DndContext>
        {savingOrder ? <p className="text-xs text-muted-foreground">Сохранение порядка…</p> : null}
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
