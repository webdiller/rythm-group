"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Pencil, Trash2 } from "lucide-react"

type Category = {
  id: number
  slug: string
  name_ru: string
  name_en: string
  order_index: number
  deleted_at: number | null
}

type AdminPost = {
  id: number
  category_id: number
  slug: string
  title_ru: string
  title_en: string
  excerpt_ru: string
  excerpt_en: string
  body_html_ru: string
  body_html_en: string
  cover_image_url: string | null
  status: "draft" | "published"
  published_at: number
  category_slug?: string
  updated_at?: string
}

export function BlogPostsEditor() {
  const router = useRouter()
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [processingPostId, setProcessingPostId] = useState<number | null>(null)
  const [processingAction, setProcessingAction] = useState<"delete" | "toggleStatus" | null>(null)
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/content/blog/categories", {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
      })
      if (!res.ok) return
      const json = (await res.json()) as { data?: Category[] }
      setCategories((json.data ?? []).filter((c) => !c.deleted_at))
    } catch {
      // ignore
    }
  }, [])

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategoryId !== "all") params.set("categoryId", filterCategoryId)
      if (filterStatus !== "all") params.set("status", filterStatus)
      const res = await fetch(`/api/content/blog/posts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${getToken() ?? ""}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("load")
      const json = (await res.json()) as { data?: AdminPost[] }
      setPosts(json.data ?? [])
    } catch {
      toast.error("Не удалось загрузить записи")
    } finally {
      setLoading(false)
    }
  }, [filterCategoryId, filterStatus])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  const handleDelete = async (id: number) => {
    if (processingPostId != null) return
    if (!confirm("Пометить запись как удалённую (soft delete)?")) return
    setProcessingPostId(id)
    setProcessingAction("delete")
    const token = getToken()
    try {
      const res = await fetch(`/api/content/blog/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      })
      if (!res.ok) {
        toast.error("Не удалось удалить")
        return
      }
      toast.success("Запись скрыта")
      void loadPosts()
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setProcessingPostId(null)
      setProcessingAction(null)
    }
  }

  const handleToggleStatus = async (id: number, isPublished: boolean) => {
    if (processingPostId != null) return
    setProcessingPostId(id)
    setProcessingAction("toggleStatus")
    const nextStatus: "draft" | "published" = isPublished ? "draft" : "published"
    const token = getToken()
    try {
      const res = await fetch(`/api/content/blog/posts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({ status: nextStatus }),
        cache: "no-store",
      })
      if (!res.ok) {
        toast.error(
          nextStatus === "published" ? "Не удалось опубликовать" : "Не удалось снять с публикации",
        )
        return
      }
      const json = (await res.json()) as { data?: AdminPost }
      if (json.data) {
        setPosts((prev) => prev.map((post) => (post.id === id ? { ...post, ...json.data } : post)))
      } else {
        setPosts((prev) =>
          prev.map((post) => (post.id === id ? { ...post, status: nextStatus } : post)),
        )
      }
      toast.success(nextStatus === "published" ? "Опубликовано" : "Снято с публикации")
    } catch {
      toast.error("Ошибка сети")
    } finally {
      setProcessingPostId(null)
      setProcessingAction(null)
    }
  }

  const catLabel = (id: number) => {
    const c = categories.find((x) => x.id === id)
    return c ? `${c.name_ru} (${c.slug})` : String(id)
  }

  const fmtTime = (unix: number) => {
    try {
      return new Date(unix * 1000).toLocaleString("ru-RU")
    } catch {
      return "—"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Записи блога</CardTitle>
        <Button size="sm" onClick={() => router.push("/dashboard/blog/posts/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Новая запись
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="grid gap-1">
            <Label>Категория</Label>
            <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name_ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Статус</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Все" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
                <SelectItem value="published">Опубликовано</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-3">Заголовок (RU)</th>
                  <th className="pb-2 pr-3">Категория</th>
                  <th className="w-[180px] pb-2 pr-3">Публикация</th>
                  <th className="pb-2 pr-3">Опубликовано</th>
                  <th className="pb-2"> </th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="max-w-[220px] py-2 pr-3 truncate font-medium">{p.title_ru}</td>
                    <td className="py-2 pr-3">{catLabel(p.category_id)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.status === "published"}
                          onCheckedChange={() => void handleToggleStatus(p.id, p.status === "published")}
                          disabled={processingPostId != null}
                          aria-label={
                            p.status === "published" ? "Снять запись с публикации" : "Опубликовать запись"
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {processingPostId === p.id && processingAction === "toggleStatus"
                            ? "Сохранение..."
                            : p.status === "published"
                              ? "Опубликовано"
                              : "Черновик"}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{fmtTime(p.published_at)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/blog/posts/${p.id}`)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleDelete(p.id)}
                          aria-label="Delete"
                          disabled={processingPostId === p.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {posts.length === 0 ? (
              <p className="mt-4 text-muted-foreground">Нет записей по фильтру.</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
