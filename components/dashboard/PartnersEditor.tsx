"use client"

import { useState, useEffect, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Edit, ArrowUp, ArrowDown, GripVertical, X, Upload } from "lucide-react"
import { buildAffiliateCaseSlug } from "@/lib/affiliate/cases-ui"
import { wishlistsCasePath } from "@/lib/wishlists-path"
import { getPartnerLogoSrc } from "@/lib/s3/partner-logo-url"
import { PartnerCaseGalleryEditor } from "@/components/dashboard/partner-case-gallery-editor"
import {
  parseRelatedChannelIds,
  serializeRelatedChannelIds,
} from "@/lib/partners/related-channel-ids"
import { getChannelAvatarSrc } from "@/lib/s3/channel-avatar-url"

interface PartnerCategory {
  id: number
  name: string
  name_ru: string
  name_en: string
  order_index: number
}

interface Partner {
  id: number
  category_id: number | null
  name: string
  // S3 object key (partners/{id}/logo-….webp); URL через getPartnerLogoSrc
  logo_url: string | null
  title_ru?: string | null
  title_en?: string | null
  short_description_ru?: string | null
  short_description_en?: string | null
  published_at?: string | null
  wishlists?: number | null
  views?: number | null
  target_url?: string | null
  developer_url?: string | null
  steam_game_url?: string | null
  show_in_landing_cases?: boolean | null
  show_in_affiliate_cases?: boolean | null
  show_in_affiliate_steam?: boolean | null
  show_wishlists?: boolean | null
  show_views?: boolean | null
  case_gallery?: string | null
  show_logo_on_case_detail?: boolean | null
  related_channel_ids?: string | null
  order_index: number
}

type ChannelOption = {
  id: number
  name: string
  avatar?: string | null
  order_index?: number | null
}

function SortableRelatedChannelItem({
  channel,
  onRemove,
}: {
  channel: ChannelOption
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  const avatarSrc = getChannelAvatarSrc({
    id: channel.id,
    avatar: channel.avatar,
    hasAvatar: Boolean(channel.avatar),
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-2 py-1.5"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-xs font-bold text-primary">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          channel.name.charAt(0)
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-sm">{channel.name}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onRemove}
        aria-label="Убрать канал"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function PartnerLogoThumb({ partner }: { partner: Partner }) {
  const src = getPartnerLogoSrc(partner)
  if (!src) return null
  return <img src={src} alt={partner.name} className="h-8 w-8 object-contain" />
}

type BlogPostOption = {
  id: number
  slug: string
  title_ru: string
  category_slug: string
  status: "draft" | "published"
  deleted_at: number | null
}

const AUTO_CASE_DETAIL_URL = "__AUTO_CASE_DETAIL__"

export function PartnersEditor() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [categories, setCategories] = useState<PartnerCategory[]>([])
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [editingCategory, setEditingCategory] = useState<PartnerCategory | null>(null)
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [draggingCategoryId, setDraggingCategoryId] = useState<number | null>(null)
  const [draggingPartnerId, setDraggingPartnerId] = useState<number | null>(null)
  const [draggingPartnerCategoryId, setDraggingPartnerCategoryId] = useState<number | null>(null)
  const [savingPartner, setSavingPartner] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [partnersRes, categoriesRes] = await Promise.all([
        fetch("/api/content/partners"),
        fetch("/api/content/partner-categories"),
      ])
      if (partnersRes.ok) {
        const json = (await partnersRes.json()) as { data?: Partner[] }
        setPartners(json.data ?? [])
      }
      if (categoriesRes.ok) {
        const json = (await categoriesRes.json()) as { data?: PartnerCategory[] }
        setCategories(json.data ?? [])
      }
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const getToken = () => {
    return document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
  }

  const handleSavePartner = async (partner: Partial<Partner>, logoFile?: File | null) => {
    if (savingPartner) return
    setSavingPartner(true)
    try {
      const token = getToken()
      const url = "/api/content/partners"
      const method = editingPartner ? "PUT" : "POST"
      let body: Partial<Partner> & { id?: number } = editingPartner
        ? { ...partner, id: editingPartner.id }
        : partner

      // Если создаём новый кейс — всегда ставим его в конец списка внутри выбранной категории (или среди без категории)
      if (!editingPartner) {
        const categoryId = body.category_id ?? null
        const existing = partners.filter((p) => p.category_id === categoryId)
        const maxOrder =
          existing.length > 0 ? Math.max(...existing.map((p) => p.order_index ?? 0)) : 0
        body = { ...body, category_id: categoryId, order_index: maxOrder + 1 }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        let createdOrUpdatedId: number | undefined
        try {
          const json = (await response.json()) as { data?: { id?: number } }
          createdOrUpdatedId = json.data?.id ?? editingPartner?.id
        } catch {
          createdOrUpdatedId = editingPartner?.id
        }

        // Для новых кейсов URL детальной страницы формируем после создания, когда появился id.
        if (!editingPartner && partner.target_url === AUTO_CASE_DETAIL_URL && createdOrUpdatedId != null) {
          const token = getToken()
          const detailUrl = wishlistsCasePath(
            buildAffiliateCaseSlug({
              id: createdOrUpdatedId,
              name: partner.name ?? "",
            }),
          )
          await fetch("/api/content/partners", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: createdOrUpdatedId, target_url: detailUrl }),
          })
        }

        // Если создаём нового партнёра и выбран логотип — загружаем его сразу после создания
        if (!editingPartner && logoFile && createdOrUpdatedId != null) {
          const maxSizeBytes = 5 * 1024 * 1024
          if (logoFile.size > maxSizeBytes) {
            toast.error("Файл логотипа не должен превышать 5 МБ")
          } else {
            const logoToken = getToken()
            const formData = new FormData()
            formData.append("file", logoFile)
            formData.append("partnerId", String(createdOrUpdatedId))
            const logoRes = await fetch("/api/content/partners/logo", {
              method: "POST",
              headers: logoToken ? { Authorization: `Bearer ${logoToken}` } : undefined,
              body: formData,
            })
            if (!logoRes.ok) {
              toast.error("Не удалось загрузить логотип")
            }
          }
        }

        toast.success(editingPartner ? "Кейс обновлён" : "Кейс добавлен")
        setIsPartnerDialogOpen(false)
        setEditingPartner(null)
        loadData()
      } else {
        toast.error("Не удалось сохранить кейс")
      }
    } catch (error) {
      toast.error("Не удалось сохранить кейс")
    } finally {
      setSavingPartner(false)
    }
  }

  const handleDeletePartner = async (id: number) => {
    if (!confirm("Удалить этот кейс?")) return
    try {
      const token = getToken()
      const response = await fetch(`/api/content/partners?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success("Кейс удалён")
        loadData()
      } else {
        toast.error("Не удалось удалить кейс")
      }
    } catch (error) {
      toast.error("Не удалось удалить кейс")
    }
  }

  const handleSaveCategory = async (category: Partial<PartnerCategory>) => {
    if (savingCategory) return
    setSavingCategory(true)
    try {
      const token = getToken()
      const url = "/api/content/partner-categories"
      const method = editingCategory ? "PUT" : "POST"
      let body: Partial<PartnerCategory> & { id?: number } = editingCategory
        ? { ...category, id: editingCategory.id }
        : category

      // Если создаём новую категорию и не задан order_index — ставим её в конец списка
      if (!editingCategory) {
        const maxOrder =
          categories.length > 0 ? Math.max(...categories.map((cat) => cat.order_index ?? 0)) : 0
        if (body.order_index == null) {
          body = { ...body, order_index: maxOrder + 1 }
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingCategory ? "Категория обновлена" : "Категория добавлена")
        setIsCategoryDialogOpen(false)
        setEditingCategory(null)
        loadData()
      } else {
        toast.error("Не удалось сохранить категорию")
      }
    } catch (error) {
      toast.error("Не удалось сохранить категорию")
    } finally {
      setSavingCategory(false)
    }
  }

  const persistCategoryOrder = async (next: PartnerCategory[]) => {
    try {
      const token = getToken()
      await Promise.all(
        next.map((cat, index) =>
          fetch("/api/content/partner-categories", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id: cat.id, order_index: index + 1 }),
          }),
        ),
      )
      toast.success("Порядок категорий сохранен")
    } catch {
      toast.error("Не удалось сохранить порядок категорий")
    }
  }

  const moveCategory = (id: number, direction: "up" | "down") => {
    const index = categories.findIndex((c) => c.id === id)
    if (index === -1) return
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= categories.length) return
    const next = categories.slice()
    const [removed] = next.splice(index, 1)
    next.splice(swapWith, 0, removed)
    setCategories(next)
    void persistCategoryOrder(next)
  }

  const onCategoryDrop = (targetId: number) => {
    if (draggingCategoryId == null || draggingCategoryId === targetId) return
    const fromIndex = categories.findIndex((c) => c.id === draggingCategoryId)
    const toIndex = categories.findIndex((c) => c.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return
    const next = categories.slice()
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setDraggingCategoryId(null)
    setCategories(next)
    void persistCategoryOrder(next)
  }

  const getPartnerList = (categoryId: number | null): Partner[] =>
    categoryId === null
      ? partners.filter((p) => p.category_id == null).sort((a, b) => a.order_index - b.order_index)
      : partners.filter((p) => p.category_id === categoryId).sort((a, b) => a.order_index - b.order_index)

  const persistPartnerOrder = async (categoryId: number | null, ordered: Partner[]) => {
    try {
      const token = getToken()
      await Promise.all(
        ordered.map((p, index) =>
          fetch("/api/content/partners", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: p.id,
              category_id: categoryId,
              order_index: index + 1,
            }),
          }),
        ),
      )
      toast.success("Порядок кейсов сохранен")
    } catch {
      toast.error("Не удалось сохранить порядок кейсов")
    }
  }

  const movePartner = (categoryId: number | null, partnerId: number, direction: "up" | "down") => {
    const list = getPartnerList(categoryId)
    const index = list.findIndex((p) => p.id === partnerId)
    if (index === -1) return
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= list.length) return
    const nextList = list.slice()
    const [removed] = nextList.splice(index, 1)
    nextList.splice(swapWith, 0, removed)
    const nextPartners = partners.slice()
    nextList.forEach((p, idx) => {
      const globalIndex = nextPartners.findIndex((g) => g.id === p.id)
      if (globalIndex !== -1) {
        nextPartners[globalIndex] = {
          ...nextPartners[globalIndex],
          category_id: categoryId,
          order_index: idx + 1,
        }
      }
    })
    setPartners(nextPartners)
    void persistPartnerOrder(categoryId, nextList)
  }

  const onPartnerDropAt = (targetCategoryId: number | null, targetIndex: number) => {
    if (draggingPartnerId == null) return
    const sourceCategoryId = draggingPartnerCategoryId
    const sourceList = getPartnerList(sourceCategoryId)
    const fromIndex = sourceList.findIndex((p) => p.id === draggingPartnerId)
    if (fromIndex === -1) return
    const targetList = getPartnerList(targetCategoryId)
    setDraggingPartnerId(null)
    setDraggingPartnerCategoryId(null)

    const moved = sourceList[fromIndex]
    if (sourceCategoryId === targetCategoryId) {
      const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
      const reordered = sourceList.slice()
      reordered.splice(fromIndex, 1)
      reordered.splice(insertIndex, 0, moved)
      const nextPartners = partners.slice()
      reordered.forEach((p, idx) => {
        const i = nextPartners.findIndex((g) => g.id === p.id)
        if (i !== -1) {
          nextPartners[i] = { ...nextPartners[i], category_id: targetCategoryId, order_index: idx + 1 }
        }
      })
      setPartners(nextPartners)
      void persistPartnerOrder(targetCategoryId, reordered)
      return
    }
    const newSourceList = sourceList.filter((p) => p.id !== moved.id)
    const newTargetList = targetList.slice()
    newTargetList.splice(targetIndex, 0, { ...moved, category_id: targetCategoryId })
    const nextPartners = partners.slice()
    newSourceList.forEach((p, idx) => {
      const i = nextPartners.findIndex((g) => g.id === p.id)
      if (i !== -1) nextPartners[i] = { ...nextPartners[i], category_id: sourceCategoryId, order_index: idx + 1 }
    })
    newTargetList.forEach((p, idx) => {
      const i = nextPartners.findIndex((g) => g.id === p.id)
      if (i !== -1) nextPartners[i] = { ...nextPartners[i], category_id: targetCategoryId, order_index: idx + 1 }
    })
    setPartners(nextPartners)
    void persistPartnerOrder(sourceCategoryId, newSourceList)
    void persistPartnerOrder(targetCategoryId, newTargetList)
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Удалить категорию? Кейсы в ней останутся без категории.")) return
    try {
      const token = getToken()
      const response = await fetch(`/api/content/partner-categories?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        toast.success("Категория удалена")
        loadData()
      } else {
        toast.error("Не удалось удалить категорию")
      }
    } catch (error) {
      toast.error("Не удалось удалить категорию")
    }
  }

  const partnersByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = partners
        .filter((p) => p.category_id === cat.id)
        .sort((a, b) => a.order_index - b.order_index)
      return acc
    },
    {} as Record<number, Partner[]>
  )
  const uncategorizedPartners = partners
    .filter((p) => p.category_id == null)
    .sort((a, b) => a.order_index - b.order_index)

  if (loading) {
    return <div className="text-center py-8">Загрузка...</div>
  }

  return (
    <div className="space-y-8">
      {/* Категории кейсов */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Категории кейсов</h2>
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setEditingCategory(null)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить категорию
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(92vh,760px)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 p-0 sm:w-full">
              <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
                <DialogTitle>
                  {editingCategory ? "Редактировать категорию" : "Добавить категорию"}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto px-4 pt-4 sm:px-6">
                <CategoryForm
                  category={editingCategory}
                  onSave={handleSaveCategory}
                  submitting={savingCategory}
                  onCancel={() => {
                    setIsCategoryDialogOpen(false)
                    setEditingCategory(null)
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  draggable
                  onDragStart={() => setDraggingCategoryId(cat.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onCategoryDrop(cat.id)}
                >
                  <div>
                    <span className="font-medium">
                      {cat.name_ru} / {cat.name_en}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (порядок: {cat.order_index})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveCategory(cat.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === categories.length - 1}
                        onClick={() => moveCategory(cat.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(cat)
                        setIsCategoryDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Нет категорий. Вы можете добавить кейс без категории.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Кейсы по категориям */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Кейсы (партнёры)</h2>
          <Dialog open={isPartnerDialogOpen} onOpenChange={setIsPartnerDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPartner(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить кейс
              </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[min(94vh,1040px)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 p-0 sm:w-full sm:max-w-6xl lg:max-w-7xl">
              <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
                <DialogTitle>
                  {editingPartner ? "Редактировать кейс" : "Добавить кейс"}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto px-4 pt-4 sm:px-6">
                <PartnerForm
                  partner={editingPartner}
                  categories={categories}
                  onSave={handleSavePartner}
                  submitting={savingPartner}
                  onGalleryJsonChange={(caseGalleryJson) => {
                    if (!editingPartner) return
                    const next = { ...editingPartner, case_gallery: caseGalleryJson }
                    setEditingPartner(next)
                    setPartners((prev) =>
                      prev.map((item) => (item.id === next.id ? { ...item, case_gallery: caseGalleryJson } : item)),
                    )
                  }}
                  onCancel={() => {
                    setIsPartnerDialogOpen(false)
                    setEditingPartner(null)
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {categories.map((category) => {
          const list = partnersByCategory[category.id] ?? []
          return (
            <Card key={category.id} className="mb-6">
              <CardHeader>
                <CardTitle>
                  {category.name_ru} / {category.name_en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {list.map((partner, index) => (
                    <div
                      key={partner.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                      draggable
                      onDragStart={() => {
                        setDraggingPartnerId(partner.id)
                        setDraggingPartnerCategoryId(category.id)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onPartnerDropAt(category.id, index)}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <PartnerLogoThumb partner={partner} />
                        <span className="truncate font-medium">{partner.name}</span>
                        <span className="text-sm text-muted-foreground">
                          (порядок: {partner.order_index})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => movePartner(category.id, partner.id, "up")}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === list.length - 1}
                            onClick={() => movePartner(category.id, partner.id, "down")}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPartner(partner)
                            setIsPartnerDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePartner(partner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {list.length > 0 && (
                    <div
                      className="min-h-[8px] rounded border border-dashed border-muted-foreground/30 opacity-60"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onPartnerDropAt(category.id, list.length)}
                    />
                  )}
                  {list.length === 0 && (
                    <div
                      className="py-2 text-center text-muted-foreground text-sm rounded border border-dashed border-muted-foreground/30"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onPartnerDropAt(category.id, 0)}
                    >
                      Перетащите кейс сюда
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Без категории</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uncategorizedPartners.map((partner, index) => (
                <div
                  key={partner.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                  draggable
                  onDragStart={() => {
                    setDraggingPartnerId(partner.id)
                    setDraggingPartnerCategoryId(null)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onPartnerDropAt(null, index)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PartnerLogoThumb partner={partner} />
                    <span className="truncate font-medium">{partner.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => movePartner(null, partner.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === uncategorizedPartners.length - 1}
                        onClick={() => movePartner(null, partner.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPartner(partner)
                        setIsPartnerDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeletePartner(partner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {uncategorizedPartners.length > 0 && (
                <div
                  className="min-h-[8px] rounded border border-dashed border-muted-foreground/30 opacity-60"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onPartnerDropAt(null, uncategorizedPartners.length)}
                />
              )}
              {uncategorizedPartners.length === 0 && (
                <div
                  className="py-2 text-center text-muted-foreground text-sm rounded border border-dashed border-muted-foreground/30"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onPartnerDropAt(null, 0)}
                >
                  Перетащите кейс сюда или добавьте кейс без категории
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {partners.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                Нет кейсов. Сначала добавьте категорию, затем кейсы.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}

function CategoryForm({
  category,
  onSave,
  submitting,
  onCancel,
}: {
  category: PartnerCategory | null
  onSave: (category: Partial<PartnerCategory>) => void
  submitting: boolean
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name_ru: category?.name_ru ?? "",
    name_en: category?.name_en ?? "",
    order_index: category?.order_index ?? 0,
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Название категории (RU)</Label>
        <Input
          value={formData.name_ru}
          onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Название категории (EN)</Label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          required
        />
      </div>
      <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:px-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Отменить
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  )
}

function PartnerForm({
  partner,
  categories,
  onSave,
  submitting,
  onCancel,
  onGalleryJsonChange,
}: {
  partner: Partner | null
  categories: PartnerCategory[]
  onSave: (partner: Partial<Partner>, logoFile?: File | null) => void
  submitting: boolean
  onCancel: () => void
  onGalleryJsonChange?: (caseGalleryJson: string) => void
}) {
  const [formData, setFormData] = useState<{
    category_id: number | null
    name: string
    title_ru: string
    title_en: string
    short_description_ru: string
    short_description_en: string
    published_at: string
    wishlists: number
    views: number
    target_url: string
    steam_game_url: string
    developer_url: string
    show_in_landing_cases: boolean
    show_in_affiliate_cases: boolean
    show_in_affiliate_steam: boolean
    show_wishlists: boolean
    show_views: boolean
    show_logo_on_case_detail: boolean
    order_index: number
  }>({
    category_id: partner?.category_id ?? (categories[0]?.id ?? null),
    name: partner?.name ?? "",
    title_ru: partner?.title_ru ?? "",
    title_en: partner?.title_en ?? "",
    short_description_ru: partner?.short_description_ru ?? "",
    short_description_en: partner?.short_description_en ?? "",
    published_at: partner?.published_at ?? "",
    wishlists: partner?.wishlists ?? 0,
    views: partner?.views ?? 0,
    target_url: partner?.target_url ?? "",
    steam_game_url: partner?.steam_game_url ?? "",
    developer_url: partner?.developer_url ?? "",
    show_in_landing_cases: partner?.show_in_landing_cases ?? true,
    show_in_affiliate_cases: partner?.show_in_affiliate_cases ?? true,
    show_in_affiliate_steam: partner?.show_in_affiliate_steam ?? true,
    show_wishlists: partner?.show_wishlists ?? true,
    show_views: partner?.show_views ?? true,
    show_logo_on_case_detail: partner?.show_logo_on_case_detail ?? true,
    order_index: partner?.order_index ?? 0,
  })

  const [hasLogo, setHasLogo] = useState(Boolean(partner?.logo_url))
  const [logoKey, setLogoKey] = useState<string | null>(partner?.logo_url ?? null)
  const [logoVersion, setLogoVersion] = useState(0)
  const [logoUploading, setLogoUploading] = useState(false)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newLogoPreviewUrl, setNewLogoPreviewUrl] = useState<string | null>(null)
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const newLogoFileInputRef = useRef<HTMLInputElement>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPostOption[]>([])
  const [channelOptions, setChannelOptions] = useState<ChannelOption[]>([])
  const [relatedChannelIds, setRelatedChannelIds] = useState<number[]>(() =>
    parseRelatedChannelIds(partner?.related_channel_ids),
  )
  const [targetType, setTargetType] = useState<"case_detail" | "blog_post">(
    partner?.target_url?.startsWith("/blog/") ? "blog_post" : "case_detail",
  )
  const [selectedBlogUrl, setSelectedBlogUrl] = useState<string>(
    partner?.target_url?.startsWith("/blog/") ? partner.target_url : "",
  )

  useEffect(() => {
    if (!newLogoFile) {
      setNewLogoPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(newLogoFile)
    setNewLogoPreviewUrl(objectUrl)
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [newLogoFile])

  useEffect(() => {
    const getToken = () =>
      document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
    const loadBlogPosts = async () => {
      try {
        const token = getToken()
        const res = await fetch("/api/content/blog/posts", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) return
        const json = (await res.json()) as { data?: BlogPostOption[] }
        const onlyPublished = (json.data ?? []).filter((post) => post.status === "published" && post.deleted_at == null)
        setBlogPosts(onlyPublished)
      } catch {
        // ignore blog list fetch errors in partner form
      }
    }

    void loadBlogPosts()

    const loadChannels = async () => {
      try {
        const res = await fetch("/api/content/channels")
        if (!res.ok) return
        const json = (await res.json()) as { data?: ChannelOption[] }
        const rows = [...(json.data ?? [])].sort(
          (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.id - b.id,
        )
        setChannelOptions(rows)
      } catch {
        // ignore channels list fetch errors in partner form
      }
    }
    void loadChannels()
  }, [])

  useEffect(() => {
    setRelatedChannelIds(parseRelatedChannelIds(partner?.related_channel_ids))
  }, [partner?.id, partner?.related_channel_ids])

  const toggleRelatedChannel = (channelId: number, checked: boolean) => {
    setRelatedChannelIds((prev) => {
      if (checked) {
        if (prev.includes(channelId)) return prev
        return [...prev, channelId]
      }
      return prev.filter((id) => id !== channelId)
    })
  }

  const relatedChannelSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleRelatedChannelDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setRelatedChannelIds((prev) => {
      const oldIndex = prev.indexOf(Number(active.id))
      const newIndex = prev.indexOf(Number(over.id))
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const NO_CATEGORY_VALUE = "none"
  const NO_BLOG_POST_VALUE = "__none__"
  const isEditingExistingPartner = partner?.id != null
  const caseDetailUrl = isEditingExistingPartner
    ? wishlistsCasePath(buildAffiliateCaseSlug({ id: partner.id, name: formData.name || partner.name }))
    : ""

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (targetType === "blog_post" && !selectedBlogUrl) {
          toast.error("Выберите статью блога для перехода из кейса")
          return
        }
        const resolvedTargetUrl =
          targetType === "blog_post"
            ? selectedBlogUrl
            : isEditingExistingPartner
              ? caseDetailUrl
              : AUTO_CASE_DETAIL_URL
        onSave(
          {
            ...formData,
            steam_game_url: formData.steam_game_url.trim() || null,
            developer_url: formData.developer_url.trim() || null,
            target_url: resolvedTargetUrl,
            category_id: formData.category_id,
            related_channel_ids: serializeRelatedChannelIds(relatedChannelIds),
          },
          newLogoFile ?? undefined,
        )
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Категория</Label>
        <Select
          value={
            formData.category_id != null
              ? String(formData.category_id)
              : NO_CATEGORY_VALUE
          }
          onValueChange={(value) =>
            setFormData({
              ...formData,
              category_id: value === NO_CATEGORY_VALUE ? null : parseInt(value, 10),
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию или оставьте без категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CATEGORY_VALUE}>
              Без категории
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={String(cat.id)}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Название</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Заголовок кейса (RU)</Label>
          <Input value={formData.title_ru} onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Заголовок кейса (EN)</Label>
          <Input value={formData.title_en} onChange={(e) => setFormData({ ...formData, title_en: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Краткое описание (RU)</Label>
          <Textarea
            value={formData.short_description_ru}
            onChange={(e) => setFormData({ ...formData, short_description_ru: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Краткое описание (EN)</Label>
          <Textarea
            value={formData.short_description_en}
            onChange={(e) => setFormData({ ...formData, short_description_en: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Дата публикации</Label>
          <Input
            type="date"
            value={formData.published_at}
            onChange={(e) => setFormData({ ...formData, published_at: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Вишлисты</Label>
          <Input
            type="number"
            value={formData.wishlists}
            onChange={(e) => setFormData({ ...formData, wishlists: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Просмотры (ручное значение)</Label>
          <Input
            type="number"
            value={formData.views}
            onChange={(e) => setFormData({ ...formData, views: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex w-full items-center justify-between">
            <div className="pr-4">
              <p>Показывать вишлисты на сайте</p>
              <p className="text-xs font-normal text-muted-foreground">
                Значение выше сохраняется в любом случае.
              </p>
            </div>
            <Switch
              checked={formData.show_wishlists}
              onCheckedChange={(checked) => setFormData({ ...formData, show_wishlists: checked })}
            />
          </Label>
        </div>
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex w-full items-center justify-between">
            <div className="pr-4">
              <p>Показывать просмотры на сайте</p>
              <p className="text-xs font-normal text-muted-foreground">
                Значение выше сохраняется в любом случае.
              </p>
            </div>
            <Switch
              checked={formData.show_views}
              onCheckedChange={(checked) => setFormData({ ...formData, show_views: checked })}
            />
          </Label>
        </div>
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex w-full items-center justify-between">
            <div className="pr-4">
              <p>Показывать аву на детальной странице</p>
              <p className="text-xs font-normal text-muted-foreground">
                Если выключено — на детальной странице остаются только изображения галереи (без аватарки
                рядом с названием).
              </p>
            </div>
            <Switch
              checked={formData.show_logo_on_case_detail}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, show_logo_on_case_detail: checked })
              }
            />
          </Label>
        </div>
      </div>
      <div className="space-y-3 rounded-md border border-border p-3">
        <div>
          <Label>Каналы публикации</Label>
          <p className="text-xs text-muted-foreground">
            Отметьте каналы из «Наши каналы», затем перетащите выбранные, чтобы задать порядок на
            детальной странице.
          </p>
        </div>
        {channelOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Сначала добавьте каналы в «Наши каналы».</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Доступные каналы</p>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border/70 p-2 lg:max-h-80">
                {channelOptions.map((channel) => {
                  const checked = relatedChannelIds.includes(channel.id)
                  const avatarSrc = getChannelAvatarSrc({
                    id: channel.id,
                    avatar: channel.avatar,
                    hasAvatar: Boolean(channel.avatar),
                  })
                  return (
                    <label
                      key={channel.id}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleRelatedChannel(channel.id, value === true)
                        }
                      />
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-xs font-bold text-primary">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                        ) : (
                          channel.name.charAt(0)
                        )}
                      </div>
                      <span className="min-w-0 truncate text-sm">{channel.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Выбранные (перетащите для порядка)
              </p>
              {relatedChannelIds.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                  Пока ничего не выбрано
                </p>
              ) : (
                <DndContext
                  sensors={relatedChannelSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleRelatedChannelDragEnd}
                >
                  {/* @ts-expect-error — occasional TS2786 between @dnd-kit/sortable and React 19 type packages */}
                  <SortableContext items={relatedChannelIds} strategy={verticalListSortingStrategy}>
                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-border/70 p-2 lg:max-h-80">
                      {relatedChannelIds.map((channelId) => {
                        const channel = channelOptions.find((item) => item.id === channelId)
                        if (!channel) return null
                        return (
                          <SortableRelatedChannelItem
                            key={channelId}
                            channel={channel}
                            onRemove={() => toggleRelatedChannel(channelId, false)}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label>Куда ведет клик по кейсу</Label>
          <Select
            value={targetType}
            onValueChange={(value: "case_detail" | "blog_post") => setTargetType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите действие при клике" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="case_detail">Перейти на детальную страницу кейса</SelectItem>
              <SelectItem value="blog_post">Выбрать статью из блога</SelectItem>
            </SelectContent>
          </Select>
          {targetType === "case_detail" && (
            <p className="text-xs text-muted-foreground">
              {isEditingExistingPartner
                ? `Будет использован URL: ${caseDetailUrl}`
                : "Для нового кейса URL детальной страницы будет сформирован автоматически после создания."}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Статья блога</Label>
          <Select
            value={selectedBlogUrl || NO_BLOG_POST_VALUE}
            onValueChange={(value) => setSelectedBlogUrl(value === NO_BLOG_POST_VALUE ? "" : value)}
            disabled={targetType !== "blog_post"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите статью" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_BLOG_POST_VALUE}>Не выбрано</SelectItem>
              {selectedBlogUrl && !blogPosts.some((post) => `/blog/${post.category_slug}/${post.slug}` === selectedBlogUrl) && (
                <SelectItem value={selectedBlogUrl}>{selectedBlogUrl}</SelectItem>
              )}
              {blogPosts.map((post) => {
                const postUrl = `/blog/${post.category_slug}/${post.slug}`
                return (
                  <SelectItem key={post.id} value={postUrl}>
                    {post.title_ru}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {targetType === "blog_post" && !selectedBlogUrl && (
            <p className="text-xs text-destructive">Выберите статью, чтобы сохранить этот вариант перехода.</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Ссылка на игру в Steam</Label>
        <Input
          value={formData.steam_game_url}
          onChange={(e) => setFormData({ ...formData, steam_game_url: e.target.value })}
          placeholder="https://store.steampowered.com/app/..."
        />
        <p className="text-xs text-muted-foreground">
          Опционально. Если заполнено — на детальной странице кейса в блоке «О игре» появится кнопка «Открыть в Steam».
        </p>
      </div>
      <div className="space-y-2">
        <Label>Ссылка издателя в Steam (блок издателей)</Label>
        <Input
          value={formData.developer_url}
          onChange={(e) => setFormData({ ...formData, developer_url: e.target.value })}
          placeholder="https://store.steampowered.com/developer/..."
        />
        <p className="text-xs text-muted-foreground">
          Опционально. Если заполнено — карточка в блоке «Издатели в Steam» станет кликабельной и покажет «Открыть в
          Steam». Если пусто — только логотип и название, без ссылки и без этой фразы.
        </p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex items-center justify-between w-full">
            <p>Показывать в кейсах на главной</p>
            <Switch
            checked={formData.show_in_landing_cases}
            onCheckedChange={(checked) => setFormData({ ...formData, show_in_landing_cases: checked })}
          />
          </Label>
          
        </div>
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex items-center justify-between w-full">
           <p> Показывать в блоке кейсов Wishlists</p>
            <Switch
            checked={formData.show_in_affiliate_cases}
            onCheckedChange={(checked) => setFormData({ ...formData, show_in_affiliate_cases: checked })}
          />
            </Label>
          
        </div>
        <div className="flex items-center justify-between rounded border p-3">
          <Label className="flex items-center justify-between w-full">
            <div className="pr-4">
              <p>Показывать в Steam-блоке Wishlists</p>
              <p className="text-xs font-normal text-muted-foreground">
                Логотип и название. Ссылка — только если заполнено поле «Ссылка издателя в Steam».
              </p>
            </div>
            <Switch
              checked={formData.show_in_affiliate_steam}
              onCheckedChange={(checked) => setFormData({ ...formData, show_in_affiliate_steam: checked })}
            />
          </Label>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Логотип / обложка партнёра</Label>
        <p className="text-xs text-muted-foreground">
          Одна картинка используется на главной, в кейсах Wishlists и в Steam-блоке. Рекомендуется квадрат или
          горизонталь от 800px, PNG/WebP с прозрачным фоном. Файл сжимается до WebP (до 5 МБ), без сильного
          даунскейла. У уже созданной карточки можно заменить или удалить изображение без пересоздания кейса.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-28 w-40 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {hasLogo && partner ? (
              <img
                key={logoVersion}
                src={
                  getPartnerLogoSrc(
                    { id: partner.id, logo_url: logoKey },
                    { cacheBust: logoVersion },
                  ) ?? undefined
                }
                alt={partner.name}
                className={`max-h-full max-w-full object-contain p-2 ${logoUploading ? "opacity-40" : ""}`}
                onError={() => setHasLogo(false)}
              />
            ) : newLogoPreviewUrl ? (
              <img
                src={newLogoPreviewUrl}
                alt={formData.name || "Новый партнёр"}
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <span className="px-2 text-center text-xs text-muted-foreground">Логотип не задан</span>
            )}
            {logoUploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-xs font-medium text-foreground">
                Загрузка…
              </div>
            ) : null}
          </div>
          {partner && (
            <div className="flex flex-col gap-2">
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setLogoUploading(true)
                  try {
                    const token = document.cookie
                      .split("; ")
                      .find((row) => row.startsWith("auth_token="))
                      ?.split("=")[1]
                    const formDataUpload = new FormData()
                    formDataUpload.append("file", file)
                    formDataUpload.append("partnerId", String(partner.id))
                    const res = await fetch("/api/content/partners/logo", {
                      method: "POST",
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      body: formDataUpload,
                    })
                    if (res.ok) {
                      const json = (await res.json()) as { data?: { logo_url?: string | null } }
                      setLogoKey(json.data?.logo_url ?? null)
                      setHasLogo(Boolean(json.data?.logo_url))
                      setLogoVersion((v) => v + 1)
                      toast.success("Изображение обновлено")
                    } else {
                      toast.error("Не удалось загрузить изображение")
                    }
                  } catch {
                    toast.error("Не удалось загрузить изображение")
                  } finally {
                    setLogoUploading(false)
                    e.target.value = ""
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {logoUploading ? "Загрузка…" : hasLogo ? "Заменить" : "Загрузить"}
                </Button>
                {hasLogo ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={logoUploading}
                    onClick={async () => {
                      if (!partner) return
                      setLogoUploading(true)
                      try {
                        const token = document.cookie
                          .split("; ")
                          .find((row) => row.startsWith("auth_token="))
                          ?.split("=")[1]
                        const formDataDelete = new FormData()
                        formDataDelete.append("partnerId", String(partner.id))
                        const res = await fetch("/api/content/partners/logo", {
                          method: "DELETE",
                          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                          body: formDataDelete,
                        })
                        if (res.ok) {
                          setLogoKey(null)
                          setHasLogo(false)
                          setLogoVersion((v) => v + 1)
                          toast.success("Изображение удалено")
                        } else {
                          toast.error("Не удалось удалить изображение")
                        }
                      } catch {
                        toast.error("Не удалось удалить изображение")
                      } finally {
                        setLogoUploading(false)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
        {!partner && (
          <div className="mt-3 flex flex-col gap-2">
            <input
              ref={newLogoFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setNewLogoFile(file)
                e.target.value = ""
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => newLogoFileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {newLogoFile ? "Выбрать другой файл" : "Загрузить файл"}
              </Button>
              {newLogoFile ? (
                <>
                  <span className="max-w-[14rem] truncate text-xs text-muted-foreground">
                    {newLogoFile.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewLogoFile(null)}
                  >
                    <X className="h-4 w-4" />
                    Сбросить
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
      {partner ? (
        <PartnerCaseGalleryEditor
          partnerId={partner.id}
          initialGalleryJson={partner.case_gallery}
          onGalleryJsonChange={onGalleryJsonChange}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          Галерею детальной страницы можно заполнить после сохранения кейса.
        </p>
      )}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Отменить
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  )
}
