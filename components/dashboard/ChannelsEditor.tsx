"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Plus, Trash2, Edit, Image as ImageIcon, ArrowUp, ArrowDown, Upload, X } from "lucide-react"
import { getChannelAvatarSrc, isChannelAvatarS3Key } from "@/lib/s3/channel-avatar-url"

interface Channel {
  id: number
  category_id: string | null
  name: string
  subscribers: string
  // Average reach/coverage for the channel
  reach: string | null
  url: string
  order_index: number
  avatar?: string | null
  hasAvatar?: boolean
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
  const [avatarsVersion, setAvatarsVersion] = useState(0)
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null)
  const [draggingChannelId, setDraggingChannelId] = useState<number | null>(null)
  const [draggingChannelCategoryId, setDraggingChannelCategoryId] = useState<string | null>(null)
  const [savingChannel, setSavingChannel] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [channelsRes, categoriesRes] = await Promise.all([fetch("/api/content/channels"), fetch("/api/content/channel-categories")])
      if (channelsRes.ok) {
        const channelsJson = (await channelsRes.json()) as { data?: Channel[] }
        setChannels(
          (channelsJson.data ?? []).map((ch) => {
            const hadAvatar = Boolean(ch.avatar)
            return {
              ...ch,
              reach: ch.reach ?? null,
              avatar: isChannelAvatarS3Key(ch.avatar) ? ch.avatar!.trim() : null,
              hasAvatar: hadAvatar,
            }
          }),
        )
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
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]
  }

  const handleSave = async (channel: Partial<Channel>, avatarFile?: File | null) => {
    if (savingChannel) return
    setSavingChannel(true)
    try {
      const token = getToken()
      const url = "/api/content/channels"
      const method = editingChannel ? "PUT" : "POST"
      let body: Partial<Channel> & { id?: number } = editingChannel ? { ...channel, id: editingChannel.id } : channel

      // Если создаём новый канал — всегда ставим в конец списка внутри выбранной группы (категории или без категории)
      if (!editingChannel) {
        const categoryId = (body.category_id ?? null) as string | null
        const existing = channels.filter((ch) => ch.category_id === categoryId)
        const maxOrder = existing.length > 0 ? Math.max(...existing.map((ch) => ch.order_index ?? 0)) : 0
        body = { ...body, category_id: categoryId ?? null, order_index: maxOrder + 1 }
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
          createdOrUpdatedId = json.data?.id
        } catch {
          createdOrUpdatedId = editingChannel?.id
        }

        // Если создаём новый канал и был выбран аватар — загружаем его сразу после создания
        if (!editingChannel && avatarFile && createdOrUpdatedId != null) {
          await handleUploadAvatar(createdOrUpdatedId, avatarFile)
        }

        toast.success(editingChannel ? "Channel updated" : "Channel created")
        setIsDialogOpen(false)
        setEditingChannel(null)
        loadData()
      } else {
        toast.error("Failed to save channel")
      }
    } catch (error) {
      toast.error("Failed to save channel")
    } finally {
      setSavingChannel(false)
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

  const channelsByCategory = categories.reduce(
    (acc, cat) => {
      acc[cat.id] = channels
        .filter((ch) => ch.category_id === cat.id)
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
      return acc
    },
    {} as Record<string, Channel[]>,
  )

  const uncategorizedChannels = channels
    .filter((ch) => !ch.category_id)
    .slice()
    .sort((a, b) => a.order_index - b.order_index)

  const handleUploadAvatar = async (channelId: number, file: File): Promise<string | null> => {
    try {
      const maxSizeBytes = 5 * 1024 * 1024
      if (file.size > maxSizeBytes) {
        toast.error("Файл не должен превышать 5 МБ")
        return null
      }

      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("channelId", String(channelId))

      const response = await fetch("/api/content/channels/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const json = (await response.json()) as { data?: { avatar?: string | null } }
        const key = isChannelAvatarS3Key(json.data?.avatar) ? json.data!.avatar!.trim() : null
        toast.success("Аватар обновлён")
        await loadData()
        setAvatarsVersion((v) => v + 1)
        return key
      } else {
        toast.error("Не удалось загрузить аватар")
        return null
      }
    } catch {
      toast.error("Не удалось загрузить аватар")
      return null
    }
  }

  const handleDeleteAvatar = async (channelId: number) => {
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("channelId", String(channelId))

      const response = await fetch("/api/content/channels/avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        toast.success("Аватар удалён")
        await loadData()
        setAvatarsVersion((v) => v + 1)
      } else {
        toast.error("Не удалось удалить аватар")
      }
    } catch {
      toast.error("Не удалось удалить аватар")
    }
  }

  const handleSaveCategory = async (category: Partial<Category>) => {
    if (savingCategory) return
    setSavingCategory(true)
    try {
      const token = getToken()
      const url = "/api/content/channel-categories"
      const method = editingCategory ? "PUT" : "POST"
      let body: Partial<Category> & { id?: string } = editingCategory ? { ...category, id: editingCategory.id } : category

      // Если создаём новую категорию — генерируем ID и ставим её в конец списка
      if (!editingCategory) {
        if (!body.id || body.id.trim() === "") {
          const source = (body.name_en || body.name_ru || "").toString().trim() || "category"
          const baseSlug =
            source
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-_]/g, "")
              .replace(/-+/g, "-")
              .replace(/^-+|-+$/g, "") || "category"

          let slug = baseSlug
          let counter = 1
          const existingIds = new Set(categories.map((cat) => cat.id))
          while (existingIds.has(slug)) {
            counter += 1
            slug = `${baseSlug}-${counter}`
          }

          body = { ...body, id: slug }
        }

        const maxOrder = categories.length > 0 ? Math.max(...categories.map((cat) => cat.order_index ?? 0)) : 0
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

  const persistCategoryOrder = async (next: Category[]) => {
    try {
      const token = getToken()
      await Promise.all(
        next.map((cat, index) =>
          fetch("/api/content/channel-categories", {
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

  const moveCategory = (id: string, direction: "up" | "down") => {
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

  const onCategoryDrop = (targetId: string) => {
    if (!draggingCategoryId || draggingCategoryId === targetId) return
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

  const getChannelList = (categoryId: string | null): Channel[] => (categoryId === null ? uncategorizedChannels : (channelsByCategory[categoryId] ?? []))

  const persistChannelOrder = async (categoryId: string | null, ordered: Channel[]) => {
    try {
      const token = getToken()
      await Promise.all(
        ordered.map((ch, index) =>
          fetch("/api/content/channels", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: ch.id,
              category_id: categoryId,
              order_index: index + 1,
            }),
          }),
        ),
      )
      toast.success("Порядок каналов сохранен")
    } catch {
      toast.error("Не удалось сохранить порядок каналов")
    }
  }

  const moveChannel = (categoryId: string | null, channelId: number, direction: "up" | "down") => {
    const list = getChannelList(categoryId)
    const index = list.findIndex((ch) => ch.id === channelId)
    if (index === -1) return
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (swapWith < 0 || swapWith >= list.length) return
    const reordered = list.slice()
    const [removed] = reordered.splice(index, 1)
    reordered.splice(swapWith, 0, removed)
    const nextChannels = channels.slice()
    reordered.forEach((ch, idx) => {
      const globalIndex = nextChannels.findIndex((c) => c.id === ch.id)
      if (globalIndex !== -1) {
        nextChannels[globalIndex] = {
          ...nextChannels[globalIndex],
          category_id: categoryId,
          order_index: idx + 1,
        }
      }
    })
    setChannels(nextChannels)
    void persistChannelOrder(categoryId, reordered)
  }

  const onChannelDropAt = (targetCategoryId: string | null, targetIndex: number) => {
    if (draggingChannelId == null) return
    const sourceCategoryId = draggingChannelCategoryId
    const sourceList = getChannelList(sourceCategoryId)
    const fromIndex = sourceList.findIndex((ch) => ch.id === draggingChannelId)
    if (fromIndex === -1) return
    const targetList = getChannelList(targetCategoryId)
    setDraggingChannelId(null)
    setDraggingChannelCategoryId(null)

    const moved = sourceList[fromIndex]
    if (sourceCategoryId === targetCategoryId) {
      const insertIndex = fromIndex < targetIndex ? targetIndex - 1 : targetIndex
      const reordered = sourceList.slice()
      reordered.splice(fromIndex, 1)
      reordered.splice(insertIndex, 0, moved)
      const nextChannels = channels.slice()
      reordered.forEach((ch, idx) => {
        const i = nextChannels.findIndex((c) => c.id === ch.id)
        if (i !== -1) {
          nextChannels[i] = {
            ...nextChannels[i],
            category_id: targetCategoryId,
            order_index: idx + 1,
          }
        }
      })
      setChannels(nextChannels)
      void persistChannelOrder(targetCategoryId, reordered)
      return
    }
    const newSourceList = sourceList.filter((ch) => ch.id !== moved.id)
    const newTargetList = targetList.slice()
    newTargetList.splice(targetIndex, 0, { ...moved, category_id: targetCategoryId })
    const nextChannels = channels.slice()
    newSourceList.forEach((ch, idx) => {
      const i = nextChannels.findIndex((c) => c.id === ch.id)
      if (i !== -1)
        nextChannels[i] = {
          ...nextChannels[i],
          category_id: sourceCategoryId,
          order_index: idx + 1,
        }
    })
    newTargetList.forEach((ch, idx) => {
      const i = nextChannels.findIndex((c) => c.id === ch.id)
      if (i !== -1)
        nextChannels[i] = {
          ...nextChannels[i],
          category_id: targetCategoryId,
          order_index: idx + 1,
        }
    })
    setChannels(nextChannels)
    void persistChannelOrder(sourceCategoryId, newSourceList)
    void persistChannelOrder(targetCategoryId, newTargetList)
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

  return (
    <div className="space-y-8">
      {loading && <div className="text-center py-2 text-muted-foreground text-sm">Загрузка данных...</div>}
      {/* Категории каналов */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Категории каналов</h2>
          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
          >
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
                <DialogTitle>{editingCategory ? "Редактировать категорию" : "Добавить категорию"}</DialogTitle>
              </DialogHeader>
              <CategoryForm
                category={editingCategory}
                onSave={handleSaveCategory}
                submitting={savingCategory}
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
                      (id: {cat.id}, порядок: {cat.order_index})
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
              {categories.length === 0 && <p className="text-muted-foreground text-center py-4">Нет категорий. Вы можете добавить канал без категории.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Каналы */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Каналы</h2>
          <Dialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditingChannel(null)}>
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
                submitting={savingChannel}
                onUploadAvatar={handleUploadAvatar}
                onDeleteAvatar={handleDeleteAvatar}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingChannel(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {categories.map((category) => {
          const list = channelsByCategory[category.id] ?? []
          return (
            <Card
              key={category.id}
              className="mb-6"
            >
              <CardHeader>
                <CardTitle>
                  {category.name_ru} / {category.name_en}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {list.map((channel, index) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      draggable
                      onDragStart={() => {
                        setDraggingChannelId(channel.id)
                        setDraggingChannelCategoryId(category.id)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onChannelDropAt(category.id, index)}
                    >
                      <div className="flex items-center gap-3">
                        <AdminChannelAvatar
                          channelId={channel.id}
                          name={channel.name}
                          avatar={channel.avatar}
                          hasAvatar={channel.hasAvatar}
                          version={avatarsVersion}
                        />
                        <div>
                          <div className="font-semibold">{channel.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {channel.subscribers} подписчиков
                            {channel.reach ? ` • охват: ${channel.reach}` : ""} • {channel.url}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveChannel(category.id, channel.id, "up")}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === list.length - 1}
                            onClick={() => moveChannel(category.id, channel.id, "down")}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
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
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(channel.id)}
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
                      onDrop={() => onChannelDropAt(category.id, list.length)}
                    />
                  )}
                  {list.length === 0 && (
                    <div
                      className="py-4 text-center text-muted-foreground rounded border border-dashed border-muted-foreground/30"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onChannelDropAt(category.id, 0)}
                    >
                      Перетащите канал сюда
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Каналы без категории — в конце, как у кейсов */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Без категории</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uncategorizedChannels.map((channel, index) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  draggable
                  onDragStart={() => {
                    setDraggingChannelId(channel.id)
                    setDraggingChannelCategoryId(null)
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onChannelDropAt(null, index)}
                >
                  <div className="flex items-center gap-3">
                    <AdminChannelAvatar
                      channelId={channel.id}
                      name={channel.name}
                      avatar={channel.avatar}
                      hasAvatar={channel.hasAvatar}
                      version={avatarsVersion}
                    />
                    <div>
                      <div className="font-semibold">{channel.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {channel.subscribers} подписчиков
                        {channel.reach ? ` • охват: ${channel.reach}` : ""} • {channel.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => moveChannel(null, channel.id, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === uncategorizedChannels.length - 1}
                        onClick={() => moveChannel(null, channel.id, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(channel.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {uncategorizedChannels.length > 0 && (
                <div
                  className="min-h-[8px] rounded border border-dashed border-muted-foreground/30 opacity-60"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onChannelDropAt(null, uncategorizedChannels.length)}
                />
              )}
              {uncategorizedChannels.length === 0 && (
                <div
                  className="py-4 text-center text-muted-foreground rounded border border-dashed border-muted-foreground/30"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onChannelDropAt(null, 0)}
                >
                  Перетащите канал сюда или добавьте канал без категории
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminChannelAvatar({ channelId, name, avatar, hasAvatar, version }: { channelId: number; name: string; avatar?: string | null; hasAvatar?: boolean; version?: number }) {
  const src = getChannelAvatarSrc({ id: channelId, avatar, hasAvatar }, { cacheBust: version })
  const [hasImage, setHasImage] = useState(Boolean(src))

  useEffect(() => {
    setHasImage(Boolean(src))
  }, [src, version, channelId])

  return (
    <div className="h-10 w-10 overflow-hidden rounded-full border border-border flex items-center justify-center bg-muted">
      {hasImage && src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setHasImage(false)}
        />
      ) : (
        <span className="text-xs font-semibold">{name.charAt(0)}</span>
      )}
    </div>
  )
}

function CategoryForm({ category, onSave, submitting, onCancel }: { category: Category | null; onSave: (category: Partial<Category>) => void; submitting: boolean; onCancel: () => void }) {
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
      {isEdit && (
        <div className="space-y-2">
          <Label>ID категории</Label>
          <Input
            value={formData.id}
            disabled
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Уникальный идентификатор (например, <code>gaming</code>, <code>esports</code>). Используется для связи каналов с категорией.
          </p>
        </div>
      )}
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
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Отменить
        </Button>
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  )
}

function ChannelForm({
  channel,
  categories,
  onSave,
  submitting,
  onUploadAvatar,
  onDeleteAvatar,
  onCancel,
}: {
  channel: Channel | null
  categories: Category[]
  onSave: (channel: Partial<Channel>, avatarFile?: File | null) => void
  submitting: boolean
  onUploadAvatar: (channelId: number, file: File) => Promise<string | null> | void
  onDeleteAvatar: (channelId: number) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    category_id: channel?.category_id ?? null,
    name: channel?.name || "",
    subscribers: channel?.subscribers || "",
    reach: channel?.reach || "",
    url: channel?.url || "",
    order_index: channel?.order_index || 0,
  })

  const [hasAvatar, setHasAvatar] = useState(Boolean(channel?.avatar) || Boolean(channel?.hasAvatar))
  const [avatarKey, setAvatarKey] = useState<string | null>(isChannelAvatarS3Key(channel?.avatar) ? channel!.avatar!.trim() : null)
  const [avatarVersion, setAvatarVersion] = useState(0)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [newAvatarPreviewUrl, setNewAvatarPreviewUrl] = useState<string | null>(null)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)
  const newAvatarFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!newAvatarFile) {
      setNewAvatarPreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(newAvatarFile)
    setNewAvatarPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [newAvatarFile])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(formData, newAvatarFile ?? undefined)
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={formData.category_id ?? "none"}
          onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? null : value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Без категории</SelectItem>
            {categories.map((cat) => (
              <SelectItem
                key={cat.id}
                value={cat.id}
              >
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
        <Label>Reach (average views)</Label>
        <Input
          value={formData.reach}
          onChange={(e) => setFormData({ ...formData, reach: e.target.value })}
          placeholder="например, 500K"
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
      {channel && (
        <div className="space-y-2">
          <Label>Аватар канала</Label>
          <div className="flex items-center gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {hasAvatar ? (
                <img
                  key={avatarVersion}
                  src={
                    getChannelAvatarSrc(
                      {
                        id: channel.id,
                        avatar: avatarKey,
                        hasAvatar: true,
                      },
                      { cacheBust: avatarVersion },
                    ) ?? undefined
                  }
                  alt={channel.name}
                  className={`h-full w-full object-cover ${avatarUploading ? "opacity-40" : ""}`}
                  onError={() => setHasAvatar(false)}
                />
              ) : (
                <span className="text-xs font-semibold">{channel.name.charAt(0)}</span>
              )}
              {avatarUploading ? <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-[10px] font-medium text-foreground">…</div> : null}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setAvatarUploading(true)
                  try {
                    const key = await onUploadAvatar(channel.id, file)
                    if (typeof key === "string" || key === null) {
                      setAvatarKey(key)
                    }
                    setHasAvatar(true)
                    setAvatarVersion((v) => v + 1)
                  } finally {
                    setAvatarUploading(false)
                    e.target.value = ""
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={avatarUploading || submitting}
                  onClick={() => avatarFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {avatarUploading ? "Загрузка…" : hasAvatar ? "Заменить" : "Загрузить"}
                </Button>
                {hasAvatar ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={avatarUploading || submitting}
                    onClick={() => {
                      onDeleteAvatar(channel.id)
                      setAvatarKey(null)
                      setHasAvatar(false)
                      setAvatarVersion((v) => v + 1)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Изображение до 5 МБ. При загрузке будет автоматически сжато до 256x256 и формата WebP.</p>
        </div>
      )}
      {!channel && (
        <div className="space-y-2">
          <Label>Аватар канала (опционально)</Label>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              {newAvatarPreviewUrl ? (
                <img
                  src={newAvatarPreviewUrl}
                  alt={formData.name || "Новый канал"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">{(formData.name || "?").charAt(0)}</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={newAvatarFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  setNewAvatarFile(file)
                  e.target.value = ""
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => newAvatarFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {newAvatarFile ? "Выбрать другой файл" : "Загрузить файл"}
                </Button>
                {newAvatarFile ? (
                  <>
                    <span className="max-w-[14rem] truncate text-xs text-muted-foreground">{newAvatarFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewAvatarFile(null)}
                    >
                      <X className="h-4 w-4" />
                      Сбросить
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Изображение до 5 МБ. При загрузке будет автоматически сжато до 256x256 и формата WebP.</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Отменить
        </Button>
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </form>
  )
}
