"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Edit } from "lucide-react"

interface Channel {
  id: number
  category_id: string
  name: string
  subscribers: string
  url: string
  order_index: number
}

interface Category {
  id: string
  name_ru: string
  name_en: string
  order_index: number
}

export function ChannelsEditor() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
   const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [channelsRes, categoriesRes] = await Promise.all([
        fetch("/api/content/channels"),
        fetch("/api/content/channel-categories"),
      ])
      if (channelsRes.ok) {
        const channelsJson = (await channelsRes.json()) as { data?: Channel[] }
        setChannels(channelsJson.data ?? [])
      }
      if (categoriesRes.ok) {
        const categoriesJson = (await categoriesRes.json()) as { data?: Category[] }
        setCategories(categoriesJson.data ?? [])
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

  const handleSave = async (channel: Partial<Channel>) => {
    try {
      const token = getToken()
      const url = editingChannel ? "/api/content/channels" : "/api/content/channels"
      const method = editingChannel ? "PUT" : "POST"
      const body = editingChannel ? { ...channel, id: editingChannel.id } : channel

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        toast.success(editingChannel ? "Channel updated" : "Channel created")
        setIsDialogOpen(false)
        setEditingChannel(null)
        loadData()
      } else {
        toast.error("Failed to save channel")
      }
    } catch (error) {
      toast.error("Failed to save channel")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this channel?")) return

    try {
      const token = getToken()
      const response = await fetch(`/api/content/channels?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success("Channel deleted")
        loadData()
      } else {
        toast.error("Failed to delete channel")
      }
    } catch (error) {
      toast.error("Failed to delete channel")
    }
  }

  const channelsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = channels.filter((ch) => ch.category_id === cat.id)
    return acc
  }, {} as Record<string, Channel[]>)

  const handleSaveCategory = async (category: Partial<Category>) => {
    try {
      const token = getToken()
      const url = "/api/content/channel-categories"
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Удалить категорию? Каналы с этой категорией останутся в списке, но без категории.")) return
    try {
      const token = getToken()
      const response = await fetch(`/api/content/channel-categories?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Категории каналов */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Категории каналов</h2>
          <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
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
                    <span className="font-medium">
                      {cat.name_ru} / {cat.name_en}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (id: {cat.id}, порядок: {cat.order_index})
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
                  Нет категорий. Добавьте категорию, затем каналы.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Каналы */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Каналы</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingChannel(null)} disabled={categories.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить канал
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingChannel ? "Редактировать канал" : "Добавить канал"}</DialogTitle>
              </DialogHeader>
              <ChannelForm
                channel={editingChannel}
                categories={categories}
                onSave={handleSave}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingChannel(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {categories.map((category) => (
          <Card key={category.id} className="mb-6">
            <CardHeader>
              <CardTitle>
                {category.name_ru} / {category.name_en}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channelsByCategory[category.id]?.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-semibold">{channel.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {channel.subscribers} подписчиков • {channel.url}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingChannel(channel)
                          setIsDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(channel.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!channelsByCategory[category.id] || channelsByCategory[category.id].length === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    В этой категории пока нет каналов
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CategoryForm({
  category,
  onSave,
  onCancel,
}: {
  category: Category | null
  onSave: (category: Partial<Category>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    id: category?.id ?? "",
    name_ru: category?.name_ru ?? "",
    name_en: category?.name_en ?? "",
    order_index: category?.order_index ?? 0,
  })

  const isEdit = Boolean(category)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>ID категории</Label>
        <Input
          value={formData.id}
          disabled={isEdit}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          Уникальный идентификатор (например, <code>gaming</code>, <code>esports</code>). Используется для связи каналов с категорией.
        </p>
      </div>
      <div className="space-y-2">
        <Label>Название (RU)</Label>
        <Input
          value={formData.name_ru}
          onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Название (EN)</Label>
        <Input
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Порядок (order index)</Label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) =>
            setFormData({
              ...formData,
              order_index: Number.isNaN(parseInt(e.target.value, 10))
                ? 0
                : parseInt(e.target.value, 10),
            })
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

function ChannelForm({
  channel,
  categories,
  onSave,
  onCancel,
}: {
  channel: Channel | null
  categories: Category[]
  onSave: (channel: Partial<Channel>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    category_id: channel?.category_id || categories[0]?.id || "",
    name: channel?.name || "",
    subscribers: channel?.subscribers || "",
    url: channel?.url || "",
    order_index: channel?.order_index || 0,
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
        <Label>Category</Label>
        <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name_ru} / {cat.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Subscribers</Label>
        <Input
          value={formData.subscribers}
          onChange={(e) => setFormData({ ...formData, subscribers: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Order Index</Label>
        <Input
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
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
