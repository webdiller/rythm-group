"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { GripVertical } from "lucide-react"
import { ABOUT_CARD_ICON_NAMES } from "@/lib/about-card-icons"
import type { AboutCardListItem } from "@/lib/schemas/about-cards"
import { getAboutIconSrc } from "@/lib/s3/about-icon-url"

const ICON_OPTIONS = [...ABOUT_CARD_ICON_NAMES].sort((a, b) => a.localeCompare(b))
const DEFAULT_CREATE_FORM = {
  icon: "Star",
  title_ru: "",
  title_en: "",
  text_ru: "",
  text_en: "",
  hidden: false,
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

function SortableAboutCard({
  item,
  onChange,
  onDelete,
  onSave,
  onUploadIcon,
  onDeleteIcon,
  iconVersion,
  isSaving,
  isDeleting,
}: {
  item: AboutCardListItem
  onChange: (id: number, patch: Partial<AboutCardListItem>) => void
  onDelete: (id: number) => Promise<void>
  onSave: (item: AboutCardListItem) => Promise<void>
  onUploadIcon: (cardId: number, file: File) => Promise<void>
  onDeleteIcon: (cardId: number) => Promise<void>
  iconVersion: number
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
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`about-card-icon-${item.id}`}>Иконка Lucide (если нет своей картинки)</Label>
        <Select
          value={item.icon}
          onValueChange={(v) => onChange(item.id, { icon: v })}
        >
          <SelectTrigger
            id={`about-card-icon-${item.id}`}
            className="w-full max-w-md"
          >
            <SelectValue placeholder="Иконка" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {ICON_OPTIONS.map((name) => (
              <SelectItem
                key={name}
                value={name}
              >
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`about-card-custom-icon-${item.id}`}>Своя иконка</Label>
        <div className="flex flex-wrap items-center gap-3">
          {item.has_custom_icon && getAboutIconSrc(item, { cacheBust: iconVersion }) ? (
            // eslint-disable-next-line @next/next/no-img-element -- превью из S3
            <img
              src={getAboutIconSrc(item, { cacheBust: iconVersion })!}
              alt=""
              className="h-12 w-12 rounded-md border border-border object-contain bg-muted/30"
              width={48}
              height={48}
            />
          ) : null}
          <input
            id={`about-card-custom-icon-${item.id}`}
            type="file"
            accept="image/*"
            className="max-w-[220px] text-xs file:mr-2 file:rounded file:border file:bg-muted file:px-2 file:py-1"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onUploadIcon(item.id, f)
              e.target.value = ""
            }}
          />
          {item.has_custom_icon ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void onDeleteIcon(item.id)}
            >
              Убрать картинку
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP до 5 МБ. На сайте показывается вместо Lucide. Сохраняется в WebP до 128×128.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`about-card-title-ru-${item.id}`}>Заголовок RU</Label>
        <Input
          id={`about-card-title-ru-${item.id}`}
          value={item.title_ru}
          onChange={(e) => onChange(item.id, { title_ru: e.target.value })}
          placeholder="Заголовок RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`about-card-title-en-${item.id}`}>Заголовок EN</Label>
        <Input
          id={`about-card-title-en-${item.id}`}
          value={item.title_en}
          onChange={(e) => onChange(item.id, { title_en: e.target.value })}
          placeholder="Title EN"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`about-card-text-ru-${item.id}`}>Текст RU</Label>
        <Textarea
          id={`about-card-text-ru-${item.id}`}
          value={item.text_ru}
          onChange={(e) => onChange(item.id, { text_ru: e.target.value })}
          placeholder="Текст RU"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`about-card-text-en-${item.id}`}>Текст EN</Label>
        <Textarea
          id={`about-card-text-en-${item.id}`}
          value={item.text_en}
          onChange={(e) => onChange(item.id, { text_en: e.target.value })}
          placeholder="Text EN"
        />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor={`about-card-hidden-${item.id}`}>Скрыть</Label>
        <Switch
          id={`about-card-hidden-${item.id}`}
          checked={!!item.hidden}
          onCheckedChange={(checked) => onChange(item.id, { hidden: checked })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`about-card-order-${item.id}`}>Порядок</Label>
        <Input
          id={`about-card-order-${item.id}`}
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

export function AboutCardsEditor() {
  const [items, setItems] = useState<AboutCardListItem[]>([])
  const [iconVersion, setIconVersion] = useState(0)
  const [savingOrder, setSavingOrder] = useState(false)
  const [savingItemId, setSavingItemId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM)

  const sortedItems = useMemo(() => [...items].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)), [items])

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  const load = async () => {
    try {
      const res = await fetch("/api/content/about-cards")
      if (!res.ok) return
      const json = (await res.json()) as { data?: AboutCardListItem[] }
      setItems((json.data ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)))
    } catch {
      toast.error("Не удалось загрузить карточки «О нас»")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const saveOne = async (item: Partial<AboutCardListItem> & { title_ru?: string; title_en?: string }) => {
    const token = getToken()
    const method = item.id ? "PUT" : "POST"
    const res = await fetch("/api/content/about-cards", {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(item),
    })
    if (!res.ok) throw new Error("save failed")
  }

  const resetCreateForm = () => {
    setCreateForm(DEFAULT_CREATE_FORM)
  }

  const persistOrder = async (ordered: AboutCardListItem[]) => {
    const token = getToken()
    const results = await Promise.all(
      ordered.map((item, i) =>
        fetch("/api/content/about-cards", {
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
    const oldIndex = sortedItems.findIndex((x) => String(x.id) === String(active.id))
    const newIndex = sortedItems.findIndex((x) => String(x.id) === String(over.id))
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(sortedItems, oldIndex, newIndex).map((item, index) => ({
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

  const updateItem = (id: number, patch: Partial<AboutCardListItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const deleteItem = async (id: number) => {
    setDeletingItemId(id)
    const token = getToken()
    try {
      const res = await fetch(`/api/content/about-cards?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (!res.ok) {
        toast.error("Не удалось удалить карточку")
        return
      }
      toast.success("Карточка удалена")
      void load()
    } catch {
      toast.error("Не удалось удалить карточку")
    } finally {
      setDeletingItemId(null)
    }
  }

  const saveItem = async (item: AboutCardListItem) => {
    setSavingItemId(item.id)
    try {
      await saveOne(item)
      toast.success("Карточка сохранена")
    } catch {
      toast.error("Не удалось сохранить карточку")
    } finally {
      setSavingItemId(null)
    }
  }

  const handleUploadIcon = async (cardId: number, file: File) => {
    try {
      const maxSizeBytes = 5 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        toast.error("Файл не должен превышать 5 МБ")
        return
      }

      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("cardId", String(cardId))

      const response = await fetch("/api/content/about-cards/icon", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const json = (await response.json()) as { data?: AboutCardListItem }
        if (json.data) {
          setItems((prev) => prev.map((x) => (x.id === cardId ? json.data! : x)))
        } else {
          void load()
        }
        setIconVersion((v) => v + 1)
        toast.success("Иконка загружена")
      } else {
        toast.error("Не удалось загрузить иконку")
      }
    } catch {
      toast.error("Не удалось загрузить иконку")
    }
  }

  const handleDeleteIcon = async (cardId: number) => {
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("cardId", String(cardId))

      const response = await fetch("/api/content/about-cards/icon", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const json = (await response.json()) as { data?: AboutCardListItem }
        if (json.data) {
          setItems((prev) => prev.map((x) => (x.id === cardId ? json.data! : x)))
        } else {
          void load()
        }
        setIconVersion((v) => v + 1)
        toast.success("Своя иконка удалена")
      } else {
        toast.error("Не удалось удалить иконку")
      }
    } catch {
      toast.error("Не удалось удалить иконку")
    }
  }

  const createCard = async () => {
    if (creating) return
    if (createForm.title_ru.trim().length === 0 || createForm.title_en.trim().length === 0 || createForm.text_ru.trim().length === 0 || createForm.text_en.trim().length === 0) {
      toast.error("Заполните все поля перед созданием карточки")
      return
    }

    setCreating(true)
    try {
      await saveOne({
        icon: createForm.icon,
        title_ru: createForm.title_ru.trim(),
        title_en: createForm.title_en.trim(),
        text_ru: createForm.text_ru.trim(),
        text_en: createForm.text_en.trim(),
        hidden: createForm.hidden,
        order_index: sortedItems.length,
      })
      toast.success("Карточка добавлена")
      setIsCreateFormOpen(false)
      resetCreateForm()
      void load()
    } catch {
      toast.error("Не удалось добавить карточку")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Главная: блок «О нас»</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Карточки под заголовком секции «Кто мы». Заголовок и подзаголовок секции по-прежнему в разделе «Переводы». Перетащите карточки за иконку слева для смены порядка.</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          <SortableList items={sortedItems.map((x) => String(x.id))}>
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <SortableAboutCard
                  key={item.id}
                  item={item}
                  onChange={updateItem}
                  onDelete={deleteItem}
                  onSave={saveItem}
                  onUploadIcon={handleUploadIcon}
                  onDeleteIcon={handleDeleteIcon}
                  iconVersion={iconVersion}
                  isSaving={savingItemId === item.id}
                  isDeleting={deletingItemId === item.id}
                />
              ))}
            </div>
          </SortableList>
        </DndContext>
        {savingOrder ? <p className="text-xs text-muted-foreground">Сохранение порядка…</p> : null}
        <div className="flex justify-end">
          {isCreateFormOpen ? (
            <Button
              variant="outline"
              onClick={() => {
                if (creating) return
                setIsCreateFormOpen(false)
                resetCreateForm()
              }}
            >
              Отмена
            </Button>
          ) : (
            <Button onClick={() => setIsCreateFormOpen(true)}>Добавить карточку</Button>
          )}
        </div>

        {isCreateFormOpen ? (
          <div className="grid gap-3 rounded-md border p-3 md:grid-cols-2">
            <div className="md:col-span-2 text-sm font-medium">Новая карточка</div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="about-card-create-icon">Иконка Lucide</Label>
              <Select
                value={createForm.icon}
                onValueChange={(v) => setCreateForm((prev) => ({ ...prev, icon: v }))}
              >
                <SelectTrigger
                  id="about-card-create-icon"
                  className="w-full max-w-md"
                >
                  <SelectValue placeholder="Иконка" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ICON_OPTIONS.map((name) => (
                    <SelectItem
                      key={name}
                      value={name}
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-card-create-title-ru">Заголовок RU</Label>
              <Input
                id="about-card-create-title-ru"
                value={createForm.title_ru}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title_ru: e.target.value }))}
                placeholder="Заголовок RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-card-create-title-en">Заголовок EN</Label>
              <Input
                id="about-card-create-title-en"
                value={createForm.title_en}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, title_en: e.target.value }))}
                placeholder="Title EN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-card-create-text-ru">Текст RU</Label>
              <Textarea
                id="about-card-create-text-ru"
                value={createForm.text_ru}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, text_ru: e.target.value }))}
                placeholder="Текст RU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about-card-create-text-en">Текст EN</Label>
              <Textarea
                id="about-card-create-text-en"
                value={createForm.text_en}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, text_en: e.target.value }))}
                placeholder="Text EN"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Label htmlFor="about-card-create-hidden">Скрыть</Label>
              <Switch
                id="about-card-create-hidden"
                checked={createForm.hidden}
                onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, hidden: checked }))}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={() => void createCard()}
                disabled={creating}
              >
                {creating ? "Добавление..." : "Создать карточку"}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
