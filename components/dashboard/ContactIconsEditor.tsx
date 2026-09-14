"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { GripVertical, Pencil, Trash2, Upload } from "lucide-react"
import type { ContactIconItem } from "@/lib/schemas/contact-icons"
import {
  DEFAULT_ICON_FILTERS,
  iconFiltersToCss,
  type IconCssFilters,
} from "@/lib/contact-icons/filters"
import { getContactIconSrc } from "@/lib/s3/contact-icon-url"
import { IconFilterEditor } from "@/components/dashboard/icon-filter-editor"

function getToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1]
}

function IconUploadSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-6 w-6 rounded bg-black/30" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-md bg-black/30" />
          <Skeleton className="h-8 w-8 rounded-md bg-black/30" />
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-16 w-16 rounded-md bg-black/30" />
          <Skeleton className="h-2.5 w-10 bg-black/30" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-16 w-16 rounded-md bg-black/30" />
          <Skeleton className="h-2.5 w-10 bg-black/30" />
        </div>
      </div>
      <Skeleton className="mx-auto h-4 w-20 bg-black/30" />
    </div>
  )
}

function SortableIconCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ContactIconItem
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const src = getContactIconSrc(item.s3_key, { cacheBust: item.updated_at ?? item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="touch-none rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Перетащить"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 py-2">
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
            {src ? (
              <img
                src={src}
                alt=""
                className="h-12 w-12 object-contain"
                style={{ filter: iconFiltersToCss(item.filter_light) }}
              />
            ) : null}
          </div>
          <span className="text-[10px] text-muted-foreground">Светлая</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
            {src ? (
              <img
                src={src}
                alt=""
                className="h-12 w-12 object-contain"
                style={{
                  filter: iconFiltersToCss(item.filter_dark ?? item.filter_light),
                }}
              />
            ) : null}
          </div>
          <span className="text-[10px] text-muted-foreground">Тёмная</span>
        </div>
      </div>
      <p className="truncate text-center text-sm font-medium" title={item.name}>
        {item.name}
      </p>
    </div>
  )
}

export function ContactIconsEditor() {
  const [items, setItems] = useState<ContactIconItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<ContactIconItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editLight, setEditLight] = useState<IconCssFilters>(DEFAULT_ICON_FILTERS)
  const [editDark, setEditDark] = useState<IconCssFilters | null>(null)
  const [filterTab, setFilterTab] = useState<"light" | "dark">("light")

  const uploading = uploadingCount > 0
  const showEmptyHint = !loading && items.length === 0 && uploadingCount === 0 && !query.trim()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/content/contact-icons")
      if (!res.ok) throw new Error("load failed")
      const json = (await res.json()) as { data?: ContactIconItem[] }
      setItems(json.data ?? [])
    } catch {
      toast.error("Не удалось загрузить иконки")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.name.toLowerCase().includes(q))
  }, [items, query])

  const openEdit = (item: ContactIconItem) => {
    setEditing(item)
    setEditName(item.name)
    setEditLight(item.filter_light)
    setEditDark(item.filter_dark)
    setFilterTab("light")
  }

  const saveEdit = async () => {
    if (!editing) return
    const name = editName.trim()
    if (!name) {
      toast.error("Укажите название")
      return
    }
    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch("/api/content/contact-icons", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          id: editing.id,
          name,
          filter_light: editLight,
          filter_dark: editDark,
        }),
      })
      if (!res.ok) {
        toast.error("Не удалось сохранить")
        return
      }
      const json = (await res.json()) as { data?: ContactIconItem }
      if (json.data) {
        setItems((prev) => prev.map((i) => (i.id === json.data!.id ? json.data! : i)))
      }
      setEditing(null)
      toast.success("Иконка сохранена")
    } catch {
      toast.error("Не удалось сохранить")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (item: ContactIconItem) => {
    if (!window.confirm(`Удалить иконку «${item.name}»?`)) return
    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/content/contact-icons?id=${item.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.status === 409) {
        const json = (await res.json()) as { message?: string }
        toast.error(json.message ?? "Иконка используется в контактах и не может быть удалена")
        return
      }
      if (!res.ok) {
        toast.error("Не удалось удалить")
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      toast.success("Иконка удалена")
    } catch {
      toast.error("Не удалось удалить")
    } finally {
      setBusy(false)
    }
  }

  const handleUpload = async (fileList: FileList | null) => {
    const selected = fileList ? Array.from(fileList) : []
    if (selected.length === 0) return

    setUploadingCount((count) => count + selected.length)
    const token = getToken()
    let successCount = 0

    // По одному файлу: скелетон снимается после каждого, как в галерее кейсов
    for (const file of selected) {
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/content/contact-icons/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        })
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null
          toast.error(json?.error ?? `Не удалось загрузить «${file.name}»`)
        } else {
          const json = (await res.json()) as { data?: ContactIconItem | ContactIconItem[] }
          const list = Array.isArray(json.data) ? json.data : json.data ? [json.data] : []
          setItems((prev) => [...prev, ...list])
          successCount += 1
        }
      } catch {
        toast.error(`Не удалось загрузить «${file.name}»`)
      } finally {
        setUploadingCount((count) => Math.max(0, count - 1))
      }
    }

    if (successCount > 1) {
      toast.success(`Загружено: ${successCount}`)
    } else if (successCount === 1) {
      toast.success("Иконка загружена")
    }
  }

  const handleReplaceFile = async (fileList: FileList | null) => {
    if (!editing || !fileList?.[0]) return
    setBusy(true)
    try {
      const token = getToken()
      const form = new FormData()
      form.append("file", fileList[0])
      form.append("iconId", String(editing.id))
      const res = await fetch("/api/content/contact-icons/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!res.ok) {
        toast.error("Не удалось заменить файл")
        return
      }
      const json = (await res.json()) as { data?: ContactIconItem }
      if (json.data) {
        setEditing(json.data)
        setItems((prev) => prev.map((i) => (i.id === json.data!.id ? json.data! : i)))
        toast.success("Файл обновлён")
      }
    } catch {
      toast.error("Не удалось заменить файл")
    } finally {
      setBusy(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (query.trim()) {
      toast.message("Сбросьте поиск, чтобы менять порядок")
      return
    }
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const previous = items
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch("/api/content/contact-icons/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      })
      if (!res.ok) {
        setItems(previous)
        toast.error("Не удалось сохранить порядок")
        return
      }
      const json = (await res.json()) as { data?: ContactIconItem[] }
      if (json.data) setItems(json.data)
    } catch {
      setItems(previous)
      toast.error("Не удалось сохранить порядок")
    } finally {
      setBusy(false)
    }
  }

  const editSrc = editing
    ? getContactIconSrc(editing.s3_key, { cacheBust: editing.updated_at ?? editing.id })
    : null

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Иконки контактов</CardTitle>
        <p className="text-sm text-muted-foreground">
          PNG/SVG до 500×500. Один файл на иконку. Фильтры меняют только саму картинку (для светлой и
          тёмной темы сайта). Порядок — перетаскиванием.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="icon-search">Поиск</Label>
            <Input
              id="icon-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название…"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="icon-upload">Массовая загрузка</Label>
            <div className="flex items-center gap-2">
              <Input
                id="icon-upload"
                type="file"
                accept="image/png,image/svg+xml"
                multiple
                disabled={busy || uploading}
                onChange={(e) => {
                  void handleUpload(e.target.files)
                  e.target.value = ""
                }}
              />
              <Upload className="hidden h-4 w-4 sm:block" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : showEmptyHint ? (
          <p className="text-sm text-muted-foreground">Иконок пока нет.</p>
        ) : (
          <div className="space-y-3">
            {filtered.length > 0 || uploadingCount > 0 ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map((i) => i.id)} strategy={rectSortingStrategy}>
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    aria-busy={uploading || undefined}
                    aria-label={uploading ? "Загрузка иконок" : undefined}
                  >
                    {filtered.map((item) => (
                      <SortableIconCard
                        key={item.id}
                        item={item}
                        onEdit={() => openEdit(item)}
                        onDelete={() => void handleDelete(item)}
                      />
                    ))}
                    {Array.from({ length: uploadingCount }, (_, index) => (
                      <IconUploadSkeleton key={`icon-upload-skeleton-${index}`} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : query.trim() ? (
              <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
            ) : null}
          </div>
        )}
      </CardContent>

      <Dialog open={editing != null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактирование иконки</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="icon-name">Название</Label>
                <Input id="icon-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="icon-replace">Заменить файл</Label>
                <Input
                  id="icon-replace"
                  type="file"
                  accept="image/png,image/svg+xml"
                  disabled={busy}
                  onChange={(e) => {
                    void handleReplaceFile(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Превью: меняется только иконка (CSS-фильтр). Фон одинаковый.
                </p>
                <div className="flex items-end justify-center gap-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
                      {editSrc ? (
                        <img
                          src={editSrc}
                          alt=""
                          className="h-16 w-16 object-contain"
                          style={{ filter: iconFiltersToCss(editLight) }}
                        />
                      ) : null}
                    </div>
                    <span className="text-xs font-medium">Светлая тема</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex h-24 w-24 items-center justify-center rounded-md bg-muted">
                      {editSrc ? (
                        <img
                          src={editSrc}
                          alt=""
                          className="h-16 w-16 object-contain"
                          style={{
                            filter: iconFiltersToCss(editDark ?? editLight),
                          }}
                        />
                      ) : null}
                    </div>
                    <span className="text-xs font-medium">Тёмная тема</span>
                    {editDark == null ? (
                      <span className="text-[10px] text-muted-foreground">= как светлая</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Tabs
                value={filterTab}
                onValueChange={(v) => {
                  const tab = v === "dark" ? "dark" : "light"
                  setFilterTab(tab)
                  if (tab === "dark" && editDark == null) {
                    setEditDark({ ...editLight })
                  }
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="light">Фильтры: светлая</TabsTrigger>
                  <TabsTrigger value="dark">Фильтры: тёмная</TabsTrigger>
                </TabsList>
                <TabsContent value="light" className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Как иконка выглядит на сайте в светлой теме.
                  </p>
                  <IconFilterEditor value={editLight} onChange={setEditLight} />
                </TabsContent>
                <TabsContent value="dark" className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Как иконка выглядит на сайте в тёмной теме. Если не нужна отдельная настройка —
                    сбросьте к светлой.
                  </p>
                  <IconFilterEditor
                    value={editDark ?? editLight}
                    onChange={(next) => setEditDark(next)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={editDark == null}
                    onClick={() => setEditDark(null)}
                  >
                    Использовать те же фильтры, что у светлой
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy} onClick={() => void saveEdit()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
