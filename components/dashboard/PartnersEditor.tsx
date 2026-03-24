"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react"
import { buildAffiliateCaseSlug } from "@/lib/affiliate/cases-ui"

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
  // base64 logo stored in DB; rendered through /api/content/partners/[id]/logo
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
  show_in_affiliate_cases?: boolean | null
  show_in_affiliate_steam?: boolean | null
  order_index: number
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
          const detailUrl = `/affiliate/cases/${buildAffiliateCaseSlug({
            id: createdOrUpdatedId,
            name: partner.name ?? "",
          })}`
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
            <DialogContent className="max-w-5xl! w-full!">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Редактировать категорию" : "Добавить категорию"}
                </DialogTitle>
              </DialogHeader>
              <CategoryForm
                category={editingCategory}
                onSave={handleSaveCategory}
                onCancel={() => {
                  setIsCategoryDialogOpen(false)
                  setEditingCategory(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {categories.map((cat, index) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
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
                  <div className="flex gap-2 items-center">
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
            <DialogContent className="max-w-5xl! w-full">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? "Редактировать кейс" : "Добавить кейс"}
                </DialogTitle>
              </DialogHeader>
              <PartnerForm
                partner={editingPartner}
                categories={categories}
                onSave={handleSavePartner}
                onCancel={() => {
                  setIsPartnerDialogOpen(false)
                  setEditingPartner(null)
                }}
              />
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
                      className="flex items-center justify-between p-3 border rounded-lg"
                      draggable
                      onDragStart={() => {
                        setDraggingPartnerId(partner.id)
                        setDraggingPartnerCategoryId(category.id)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onPartnerDropAt(category.id, index)}
                    >
                      <div className="flex items-center gap-3">
                        {partner.logo_url ? (
                          <img
                            src={`/api/content/partners/${partner.id}/logo`}
                            alt={partner.name}
                            className="h-8 w-8 object-contain"
                          />
                        ) : null}
                        <span className="font-medium">{partner.name}</span>
                        <span className="text-sm text-muted-foreground">
                          (порядок: {partner.order_index})
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
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
                  className="flex items-center justify-between p-3 border rounded-lg"
                  draggable
                  onDragStart={() => {
                    setDraggingPartnerId(partner.id)
                    setDraggingPartnerCategoryId(null)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onPartnerDropAt(null, index)}
                >
                  <div className="flex items-center gap-3">
                    {partner.logo_url ? (
                      <img
                        src={`/api/content/partners/${partner.id}/logo`}
                        alt={partner.name}
                        className="h-8 w-8 object-contain"
                      />
                    ) : null}
                    <span className="font-medium">{partner.name}</span>
                  </div>
                  <div className="flex gap-2 items-center">
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
  onCancel,
}: {
  category: PartnerCategory | null
  onSave: (category: Partial<PartnerCategory>) => void
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отменить
        </Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  )
}

function PartnerForm({
  partner,
  categories,
  onSave,
  onCancel,
}: {
  partner: Partner | null
  categories: PartnerCategory[]
  onSave: (partner: Partial<Partner>, logoFile?: File | null) => void
  onCancel: () => void
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
    developer_url: string
    show_in_affiliate_cases: boolean
    show_in_affiliate_steam: boolean
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
    developer_url: partner?.developer_url ?? "",
    show_in_affiliate_cases: partner?.show_in_affiliate_cases ?? true,
    show_in_affiliate_steam: partner?.show_in_affiliate_steam ?? true,
    order_index: partner?.order_index ?? 0,
  })

  const [hasLogo, setHasLogo] = useState(Boolean(partner?.logo_url))
  const [logoVersion, setLogoVersion] = useState(0)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newLogoPreviewUrl, setNewLogoPreviewUrl] = useState<string | null>(null)
  const [blogPosts, setBlogPosts] = useState<BlogPostOption[]>([])
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
  }, [])

  const NO_CATEGORY_VALUE = "none"
  const NO_BLOG_POST_VALUE = "__none__"
  const isEditingExistingPartner = partner?.id != null
  const caseDetailUrl = isEditingExistingPartner
    ? `/affiliate/cases/${buildAffiliateCaseSlug({ id: partner.id, name: formData.name || partner.name })}`
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
            target_url: resolvedTargetUrl,
            category_id: formData.category_id,
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
      <div className="grid gap-4 md:grid-cols-2">
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>URL разработчика/издателя (Steam)</Label>
          <Input
            value={formData.developer_url}
            onChange={(e) => setFormData({ ...formData, developer_url: e.target.value })}
            placeholder="https://store.steampowered.com/developer/..."
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between rounded border p-3">
          <Label>Показывать в блоке кейсов Affiliate</Label>
          <Switch
            checked={formData.show_in_affiliate_cases}
            onCheckedChange={(checked) => setFormData({ ...formData, show_in_affiliate_cases: checked })}
          />
        </div>
        <div className="flex items-center justify-between rounded border p-3">
          <Label>Показывать в Steam-блоке Affiliate</Label>
          <Switch
            checked={formData.show_in_affiliate_steam}
            onCheckedChange={(checked) => setFormData({ ...formData, show_in_affiliate_steam: checked })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Логотип партнёра</Label>
        <p className="text-xs text-muted-foreground">
          Загрузите логотип партнёра. Рекомендуемое разрешение: 320×120 px, формат PNG/WebP, прозрачный фон. Файл будет
          автоматически сжат до WebP (не более 5 МБ).
        </p>
        <div className="flex items-center gap-4">
          <div className="h-16 w-32 flex items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {hasLogo && partner ? (
              <img
                key={logoVersion}
                src={`/api/content/partners/${partner.id}/logo?ts=${logoVersion}`}
                alt={partner.name}
                className="max-h-16 w-full object-contain"
                onError={() => setHasLogo(false)}
              />
            ) : (
              <span className="text-xs text-muted-foreground text-center px-2">Логотип не задан</span>
            )}
          </div>
          {partner && (
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("auth_token="))
                    ?.split("=")[1]
                  const formData = new FormData()
                  formData.append("file", file)
                  formData.append("partnerId", String(partner.id))
                  const res = await fetch("/api/content/partners/logo", {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    body: formData,
                  })
                  if (res.ok) {
                    setHasLogo(true)
                    setLogoVersion((v) => v + 1)
                    toast.success("Логотип обновлён")
                  } else {
                    toast.error("Не удалось загрузить логотип")
                  }
                  e.target.value = ""
                }}
              />
              {hasLogo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!partner) return
                    const token = document.cookie
                      .split("; ")
                      .find((row) => row.startsWith("auth_token="))
                      ?.split("=")[1]
                    const formData = new FormData()
                    formData.append("partnerId", String(partner.id))
                    const res = await fetch("/api/content/partners/logo", {
                      method: "DELETE",
                      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                      body: formData,
                    })
                    if (res.ok) {
                      setHasLogo(false)
                      setLogoVersion((v) => v + 1)
                      toast.success("Логотип удалён")
                    } else {
                      toast.error("Не удалось удалить логотип")
                    }
                  }}
                >
                  Удалить логотип
                </Button>
              )}
            </div>
          )}
        </div>
        {!partner && (
          <div className="mt-3 flex flex-col gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                setNewLogoFile(file)
              }}
            />
            {newLogoPreviewUrl && (
              <div className="h-16 w-32 flex items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={newLogoPreviewUrl}
                  alt={formData.name || "Новый партнёр"}
                  className="max-h-16 w-full object-contain"
                />
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отменить
        </Button>
        <Button type="submit">Сохранить</Button>
      </div>
    </form>
  )
}
