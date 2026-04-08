"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor"
import { toast } from "sonner"
import { ArrowLeft, Trash2, Upload } from "lucide-react"
import { isLocalBlogUploadUrl } from "@/lib/blog/local-upload-url"
import { slugifyRuTitle } from "@/lib/blog/slug"

function unixToDatetimeLocal(sec: number): string {
  const d = new Date(sec * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function datetimeLocalToUnix(s: string): number {
  const t = new Date(s).getTime()
  if (Number.isNaN(t)) return Math.floor(Date.now() / 1000)
  return Math.floor(t / 1000)
}

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
}

const emptyBody = "<p></p>"

export function BlogPostFormPage({ postId }: { postId?: number }) {
  const router = useRouter()
  const isEdit = postId != null && !Number.isNaN(postId)
  const [authReady, setAuthReady] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [category_id, setCategoryId] = useState(0)
  const [slug, setSlug] = useState("")
  /** Пока false — slug пересчитывается из заголовка RU; true — пользователь правил slug вручную. */
  const [slugTouched, setSlugTouched] = useState(false)
  const [title_ru, setTitleRu] = useState("")
  const [title_en, setTitleEn] = useState("")
  const [excerpt_ru, setExcerptRu] = useState("")
  const [excerpt_en, setExcerptEn] = useState("")
  const [body_html_ru, setBodyHtmlRu] = useState(emptyBody)
  const [body_html_en, setBodyHtmlEn] = useState(emptyBody)
  const [cover_image_url, setCoverImageUrl] = useState("")
  const [coverUploading, setCoverUploading] = useState(false)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [publishedAtLocal, setPublishedAtLocal] = useState(() =>
    unixToDatetimeLocal(Math.floor(Date.now() / 1000)),
  )

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const verifyAuth = useCallback(async () => {
    const token = getToken()
    if (!token) {
      router.replace("/dashboard/login")
      return false
    }
    const res = await fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok || !(await res.json()).valid) {
      router.replace("/dashboard/login")
      return false
    }
    return true
  }, [router])

  useEffect(() => {
    void (async () => {
      if (!(await verifyAuth())) return
      setAuthReady(true)
    })()
  }, [verifyAuth])

  const loadCategories = useCallback(async () => {
    const token = getToken()
    const res = await fetch("/api/content/blog/categories", {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
    if (!res.ok) return
    const json = (await res.json()) as { data?: Category[] }
    const list = (json.data ?? []).filter((c) => !c.deleted_at)
    setCategories(list)
    if (!isEdit && list.length > 0) {
      setCategoryId((prev) => (prev === 0 ? list[0].id : prev))
    }
  }, [isEdit])

  useEffect(() => {
    if (!authReady) return
    void loadCategories()
  }, [authReady, loadCategories])

  useEffect(() => {
    if (!authReady || !isEdit || postId == null) return
    const token = getToken()
    setLoading(true)
    void (async () => {
      try {
        const res = await fetch(`/api/content/blog/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token ?? ""}` },
          cache: "no-store",
        })
        if (!res.ok) {
          toast.error("Запись не найдена")
          router.replace("/dashboard?tab=blog")
          return
        }
        const json = (await res.json()) as { data?: AdminPost }
        const row = json.data
        if (!row) {
          router.replace("/dashboard?tab=blog")
          return
        }
        setCategoryId(row.category_id)
        setSlug(row.slug)
        setTitleRu(row.title_ru)
        setTitleEn(row.title_en)
        setExcerptRu(row.excerpt_ru)
        setExcerptEn(row.excerpt_en)
        setBodyHtmlRu(row.body_html_ru?.trim() ? row.body_html_ru : emptyBody)
        setBodyHtmlEn(row.body_html_en?.trim() ? row.body_html_en : emptyBody)
        setCoverImageUrl(row.cover_image_url ?? "")
        setStatus(row.status)
        setPublishedAtLocal(unixToDatetimeLocal(row.published_at))
      } catch {
        toast.error("Ошибка загрузки")
        router.replace("/dashboard?tab=blog")
      } finally {
        setLoading(false)
      }
    })()
  }, [authReady, isEdit, postId, router])

  const resetCoverFileInput = () => {
    const el = coverFileInputRef.current
    if (el) el.value = ""
  }

  const deleteLocalBlogUploadFile = async (url: string): Promise<boolean> => {
    const token = getToken()
    const res = await fetch("/api/content/blog/upload/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      alert(err.error ?? "Не удалось удалить файл с диска")
      toast.error(err.error ?? "Не удалось удалить файл с диска")
      return false
    }
    return true
  }

  const uploadCover = async (file: File | null) => {
    if (!file) return
    const previousUrl = cover_image_url.trim()
    setCoverUploading(true)
    const token = getToken()
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/content/blog/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        alert(err.error ?? "Загрузка не удалась")
        toast.error(err.error ?? "Загрузка не удалась")
        return
      }
      const json = (await res.json()) as { data?: { url?: string } }
      const url = json.data?.url
      if (url) {
        if (
          !isEdit &&
          previousUrl &&
          previousUrl !== url &&
          isLocalBlogUploadUrl(previousUrl)
        ) {
          await deleteLocalBlogUploadFile(previousUrl)
        }
        setCoverImageUrl(url)
        toast.success("Файл загружен")
      }
    } catch {
      alert("Ошибка загрузки")
      toast.error("Ошибка загрузки")
    } finally {
      setCoverUploading(false)
      resetCoverFileInput()
    }
  }

  const clearCover = async () => {
    const u = cover_image_url.trim()
    if (!isEdit && u && isLocalBlogUploadUrl(u)) {
      const ok = await deleteLocalBlogUploadFile(u)
      if (!ok) return
    }
    setCoverImageUrl("")
    resetCoverFileInput()
  }

  const openCoverFilePicker = () => {
    coverFileInputRef.current?.click()
  }

  const trimmedCoverUrl = cover_image_url.trim()
  const hasCoverPreview = trimmedCoverUrl.length > 0

  const save = async () => {
    if (!category_id) {
      toast.error("Выберите категорию")
      return
    }
    const token = getToken()
    const payload = {
      category_id,
      slug,
      title_ru,
      title_en,
      excerpt_ru,
      excerpt_en,
      body_html_ru,
      body_html_en,
      cover_image_url: cover_image_url === "" ? null : cover_image_url,
      status,
      published_at: datetimeLocalToUnix(publishedAtLocal),
    }
    setSaving(true)
    try {
      if (isEdit && postId != null) {
        const res = await fetch(`/api/content/blog/posts/${postId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          alert(err.error ?? "Не удалось сохранить")
          toast.error(err.error ?? "Не удалось сохранить")
          return
        }
        toast.success("Запись обновлена")
      } else {
        const res = await fetch("/api/content/blog/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string }
          alert(err.error ?? "Не удалось создать")
          toast.error(err.error ?? "Не удалось создать")
          return
        }
        toast.success("Запись создана")
      }
      router.push("/dashboard?tab=blog")
    } catch {
      alert("Ошибка сети")
      toast.error("Ошибка сети")
    } finally {
      setSaving(false)
    }
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Проверка доступа…</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Загрузка записи…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-3 px-4">
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/dashboard?tab=blog">
              <ArrowLeft className="h-4 w-4" />
              К списку
            </Link>
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Блог</span>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">{isEdit ? "Редактировать запись" : "Новая запись"}</h1>

        <div className="space-y-8">
          <div className="grid gap-2">
            <Label>Категория</Label>
            <Select value={category_id ? String(category_id) : ""} onValueChange={(v) => setCategoryId(Number(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name_ru}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">Сначала создайте категории в разделе «Блог».</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bps-tru">Заголовок RU</Label>
              <Input
                id="bps-tru"
                value={title_ru}
                onChange={(e) => {
                  const v = e.target.value
                  setTitleRu(v)
                  if (!isEdit && !slugTouched) {
                    setSlug(slugifyRuTitle(v))
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bps-ten">Заголовок EN</Label>
              <Input id="bps-ten" value={title_en} onChange={(e) => setTitleEn(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bps-slug">Slug поста (латиница, kebab-case)</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="bps-slug"
                className="sm:flex-1"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
                placeholder="my-post-slug"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setSlug(slugifyRuTitle(title_ru))
                  if (!isEdit) setSlugTouched(false)
                }}
              >
                Сгенерировать slug
              </Button>
            </div>
            {!isEdit ? (
              <p className="text-xs text-muted-foreground">
                Для новой статьи slug подставляется из заголовка RU. После ручного правления slug кнопка выше снова строит его из заголовка и включает автоподстановку.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Кнопка «Сгенерировать slug» подставляет slug из текущего заголовка RU.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bps-eru">Анонс RU</Label>
              <Textarea id="bps-eru" rows={3} value={excerpt_ru} onChange={(e) => setExcerptRu(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bps-een">Анонс EN</Label>
              <Textarea id="bps-een" rows={3} value={excerpt_en} onChange={(e) => setExcerptEn(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Тело статьи (RU)</Label>
            <SimpleEditor value={body_html_ru} onChange={setBodyHtmlRu} placeholder="Текст на русском…" />
            <p className="text-xs text-muted-foreground">
              В редакторе можно добавить одно видео (URL или загрузка mp4/webm до 100MB) и постер.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Тело статьи (EN)</Label>
            <SimpleEditor value={body_html_en} onChange={setBodyHtmlEn} placeholder="English content…" />
          </div>

          <div className="grid gap-2">
            <Label>Обложка (URL или загрузка ≤10 МБ)</Label>
            <Input
              value={cover_image_url}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://... или /uploads/blog/..."
            />
            <input
              ref={coverFileInputRef}
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/gif"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => void uploadCover(e.target.files?.[0] ?? null)}
            />
            {hasCoverPreview ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="relative inline-flex max-w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                  <img
                    key={trimmedCoverUrl}
                    src={trimmedCoverUrl}
                    alt="Превью обложки"
                    className={`max-h-40 w-auto max-w-full object-contain object-top-left ${coverUploading ? "opacity-40" : ""}`}
                  />
                  {coverUploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 text-sm font-medium text-foreground">
                      Загрузка…
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    disabled={coverUploading}
                    onClick={openCoverFilePicker}
                  >
                    <Upload className="h-4 w-4" />
                    Заменить
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={coverUploading}
                    onClick={clearCover}
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                disabled={coverUploading}
                onClick={openCoverFilePicker}
              >
                <Upload className="h-4 w-4" />
                {coverUploading ? "Загрузка…" : "Загрузить файл"}
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:max-w-md">
            <Label htmlFor="bps-published-at">Дата и время публикации (локальное время браузера)</Label>
            <Input
              id="bps-published-at"
              type="datetime-local"
              value={publishedAtLocal}
              onChange={(e) => setPublishedAtLocal(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Используется для сортировки и отображения даты в карточках. При первой публикации черновика можно оставить или изменить.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="bps-pub" checked={status === "published"} onCheckedChange={(c) => setStatus(c ? "published" : "draft")} />
            <Label htmlFor="bps-pub">Опубликовано</Label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => void save()} disabled={saving || categories.length === 0}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard?tab=blog">Отмена</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
