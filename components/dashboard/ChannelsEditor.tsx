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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Channels</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingChannel(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Channel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChannel ? "Edit Channel" : "Add Channel"}</DialogTitle>
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
        <Card key={category.id}>
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
                      {channel.subscribers} subscribers • {channel.url}
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
                <p className="text-muted-foreground text-center py-4">No channels in this category</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
