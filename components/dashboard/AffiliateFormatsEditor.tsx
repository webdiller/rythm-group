"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { GripVertical } from "lucide-react"

type AffiliateFormat = {
  id: number
  title_ru: string
  title_en: string
  body_ru: string
  body_en: string
  hidden: boolean | null
  order_index: number | null
}

function SortableList({ items, children }: { items: string[]; children: ReactNode }) {
  return (
    // @ts-ignore dnd-kit JSX typing mismatch in some envs
    <SortableContext
      items={items}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  )
}

function SortableFormatCard({
  item,
  onChange,
  onDelete,
  onSave,
  isSaving,
  isDeleting,
}: {
  item: AffiliateFormat
  onChange: (id: number, patch: Partial<AffiliateFormat>) => void
  onDelete: (id: number) => Promise<void>
  onSave: (item: AffiliateFormat) => Promise<void>
  isSaving: boolean
  isDeleting: boolean
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
    <div
      ref={setNodeRef}
      style={style}
      className="grid gap-2 rounded border p-3 md:grid-cols-2"
    >
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
        <Label htmlFor={`aff-format-title-ru-${item.id}`}>Title RU</Label>
        <Input
          id={`aff-format-title-ru-${item.id}`}
          value={item.title_ru}
          onChange={(e) => onChange(item.id, { title_ru: e.target.value })}
          placeholder="Title RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-format-title-en-${item.id}`}>Title EN</Label>
        <Input
          id={`aff-format-title-en-${item.id}`}
          value={item.title_en}
          onChange={(e) => onChange(item.id, { title_en: e.target.value })}
          placeholder="Title EN"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-format-body-ru-${item.id}`}>Body RU</Label>
        <Textarea
          id={`aff-format-body-ru-${item.id}`}
          value={item.body_ru}
          onChange={(e) => onChange(item.id, { body_ru: e.target.value })}
          placeholder="Body RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-format-body-en-${item.id}`}>Body EN</Label>
        <Textarea
          id={`aff-format-body-en-${item.id}`}
          value={item.body_en}
          onChange={(e) => onChange(item.id, { body_en: e.target.value })}
          placeholder="Body EN"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`aff-format-hidden-${item.id}`}>Скрыть</Label>
        <Switch
          id={`aff-format-hidden-${item.id}`}
          checked={!!item.hidden}
          onCheckedChange={(checked) => onChange(item.id, { hidden: checked })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`aff-format-order-${item.id}`}>Порядок</Label>
        <Input
          id={`aff-format-order-${item.id}`}
          type="number"
          value={item.order_index ?? 0}
          onChange={(e) => onChange(item.id, { order_index: Number(e.target.value) })}
          placeholder="Order"
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => void onDelete(item.id)}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? "Удаление..." : "Удалить"}
        </Button>
        <Button
          onClick={() => void onSave(item)}
          disabled={isSaving || isDeleting}
        >
          {isSaving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </div>
  )
}

export function AffiliateFormatsEditor() {
  const [items, setItems] = useState<AffiliateFormat[]>([])
  const [savingOrder, setSavingOrder] = useState(false)
  const [savingItemId, setSavingItemId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

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

  const persistOrder = async (ordered: AffiliateFormat[]) => {
    const token = getToken()
    const results = await Promise.all(
      ordered.map((item, i) =>
        fetch("/api/content/affiliate-formats", {
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

  const updateItem = (id: number, patch: Partial<AffiliateFormat>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const deleteItem = async (id: number) => {
    setDeletingItemId(id)
    const token = getToken()
    try {
      const res = await fetch(`/api/content/affiliate-formats?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        toast.error("Не удалось удалить формат")
        return
      }
      toast.success("Формат удалён")
      void load()
    } catch {
      toast.error("Не удалось удалить формат")
    } finally {
      setDeletingItemId(null)
    }
  }

  const saveItem = async (item: AffiliateFormat) => {
    setSavingItemId(item.id)
    try {
      await saveOne(item)
      toast.success("Формат сохранён")
    } catch {
      toast.error("Не удалось сохранить формат")
    } finally {
      setSavingItemId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Affiliate: форматы сотрудничества</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Перетащите карточки за иконку слева для смены порядка.</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableList items={items.map((x) => String(x.id))}>
            <div className="space-y-3">
              {items.map((item) => (
                <SortableFormatCard
                  key={item.id}
                  item={item}
                  onChange={updateItem}
                  onDelete={deleteItem}
                  onSave={saveItem}
                  isSaving={savingItemId === item.id}
                  isDeleting={deletingItemId === item.id}
                />
              ))}
            </div>
          </SortableList>
        </DndContext>
        {savingOrder ? <p className="text-xs text-muted-foreground">Сохранение порядка…</p> : null}
        <div className="flex justify-end">
          <Button
            disabled={creating}
            onClick={async () => {
              if (creating) return
              setCreating(true)
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
              } finally {
                setCreating(false)
              }
            }}
          >
            {creating ? "Добавление..." : "Добавить формат"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
