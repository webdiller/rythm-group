"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Edit, ArrowUp, ArrowDown } from "lucide-react"

interface PartnerCategory {
  id: number
  name: string
  order_index: number
}

interface Partner {
  id: number
  category_id: number | null
  name: string
  // base64 logo stored in DB; rendered through /api/content/partners/[id]/logo
  logo_url: string | null
  order_index: number
}

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

  const persistPartnerOrder = async (ordered: Partner[]) => {
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
            body: JSON.stringify({ id: p.id, order_index: index + 1 }),
          }),
        ),
      )
    } catch {
      toast.error("Не удалось сохранить порядок кейсов")
    }
  }

  const movePartner = (list: Partner[], partnerId: number, direction: "up" | "down") => {
    const index = list.findIndex((p) => p.id === partnerId)
    if (index === -1) return list
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= list.length) return list
    const nextList = list.slice()
    const [removed] = nextList.splice(index, 1)
    nextList.splice(swapWith, 0, removed)
    const nextPartners = partners.slice()
    nextList.forEach((p, idx) => {
      const globalIndex = nextPartners.findIndex((g) => g.id === p.id)
      if (globalIndex !== -1) {
        nextPartners[globalIndex] = { ...nextPartners[globalIndex], order_index: idx + 1 }
      }
    })
    setPartners(nextPartners)
    void persistPartnerOrder(nextList)
    return nextList
  }

  const onPartnerDrop = (list: Partner[], targetId: number) => {
    if (draggingPartnerId == null || draggingPartnerId === targetId) return list
    const fromIndex = list.findIndex((p) => p.id === draggingPartnerId)
    const toIndex = list.findIndex((p) => p.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return list
    const nextList = list.slice()
    const [moved] = nextList.splice(fromIndex, 1)
    nextList.splice(toIndex, 0, moved)
    const nextPartners = partners.slice()
    nextList.forEach((p, idx) => {
      const globalIndex = nextPartners.findIndex((g) => g.id === p.id)
      if (globalIndex !== -1) {
        nextPartners[globalIndex] = { ...nextPartners[globalIndex], order_index: idx + 1 }
      }
    })
    setDraggingPartnerId(null)
    setPartners(nextPartners)
    void persistPartnerOrder(nextList)
    return nextList
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
            <DialogContent>
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
                    <span className="font-medium">{cat.name}</span>
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
                  Нет категорий. Добавьте категорию, затем кейсы.
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
              <Button
                onClick={() => setEditingPartner(null)}
                disabled={categories.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить кейс
              </Button>
            </DialogTrigger>
            <DialogContent>
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

        {categories.map((category) => (
          <Card key={category.id} className="mb-6">
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="space-y-3">
                {(partnersByCategory[category.id] ?? []).map((partner, index, list) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    draggable
                    onDragStart={() => setDraggingPartnerId(partner.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onPartnerDrop(list, partner.id)}
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
                          onClick={() => movePartner(list, partner.id, "up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === list.length - 1}
                          onClick={() => movePartner(list, partner.id, "down")}
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
                {(partnersByCategory[category.id] ?? []).length === 0 && (
                  <p className="text-muted-foreground text-center py-2 text-sm">
                    В этой категории пока нет кейсов
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {uncategorizedPartners.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Без категории</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uncategorizedPartners.map((partner, index, list) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                    draggable
                    onDragStart={() => setDraggingPartnerId(partner.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onPartnerDrop(list, partner.id)}
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
                          onClick={() => movePartner(list, partner.id, "up")}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === list.length - 1}
                          onClick={() => movePartner(list, partner.id, "down")}
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
              </div>
            </CardContent>
          </Card>
        )}

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
    name: category?.name ?? "",
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
        <Label>Название категории</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
    order_index: number
  }>({
    category_id: partner?.category_id ?? (categories[0]?.id ?? null),
    name: partner?.name ?? "",
    order_index: partner?.order_index ?? 0,
  })

  const [hasLogo, setHasLogo] = useState(Boolean(partner?.logo_url))
  const [logoVersion, setLogoVersion] = useState(0)
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newLogoPreviewUrl, setNewLogoPreviewUrl] = useState<string | null>(null)

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

  const NO_CATEGORY_VALUE = "none"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(
          {
            ...formData,
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
