"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"

interface PartnerCategory {
  id: number
  name: string
  order_index: number
}

interface Partner {
  id: number
  category_id: number | null
  name: string
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

  const handleSavePartner = async (partner: Partial<Partner>) => {
    try {
      const token = getToken()
      const url = "/api/content/partners"
      const method = editingPartner ? "PUT" : "POST"
      const body = editingPartner ? { ...partner, id: editingPartner.id } : partner

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
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
      const body = editingCategory ? { ...category, id: editingCategory.id } : category

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
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (порядок: {cat.order_index})
                    </span>
                  </div>
                  <div className="flex gap-2">
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
                {(partnersByCategory[category.id] ?? []).map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      ) : null}
                      <span className="font-medium">{partner.name}</span>
                      <span className="text-sm text-muted-foreground">
                        (порядок: {partner.order_index})
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                {uncategorizedPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt=""
                          className="h-8 w-8 object-contain"
                        />
                      ) : null}
                      <span className="font-medium">{partner.name}</span>
                    </div>
                    <div className="flex gap-2">
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
      <div className="space-y-2">
        <Label>Порядок (order index)</Label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) =>
            setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })
          }
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
  onSave: (partner: Partial<Partner>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<{
    category_id: number | null
    name: string
    logo_url: string
    order_index: number
  }>({
    category_id: partner?.category_id ?? (categories[0]?.id ?? null),
    name: partner?.name ?? "",
    logo_url: partner?.logo_url ?? "",
    order_index: partner?.order_index ?? 0,
  })

  const NO_CATEGORY_VALUE = "none"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave({
          ...formData,
          category_id: formData.category_id,
          logo_url: formData.logo_url || null,
        })
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
        <Label>Ссылка на логотип (необязательно)</Label>
        <Input
          value={formData.logo_url}
          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label>Порядок (order index)</Label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) =>
            setFormData({ ...formData, order_index: parseInt(e.target.value, 10) || 0 })
          }
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
