"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function SiteSettingsEditor() {
  const [hasFavicon, setHasFavicon] = useState(false)
  const [faviconVersion, setFaviconVersion] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = `/api/site/favicon?ts=${Date.now()}`
    img.onload = () => setHasFavicon(true)
    img.onerror = () => setHasFavicon(false)
  }, [])

  const getToken = () => {
    return document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
  }

  const handleUpload = async (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    setUploading(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/site/favicon", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        toast.error("Не удалось загрузить фавикон")
        return
      }

      setHasFavicon(true)
      setFaviconVersion((v) => v + 1)
      toast.success("Фавикон обновлён")
    } catch {
      toast.error("Не удалось загрузить фавикон")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/favicon", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        toast.error("Не удалось удалить фавикон")
        return
      }

      setHasFavicon(false)
      setFaviconVersion((v) => v + 1)
      toast.success("Фавикон сброшен до значения по умолчанию")
    } catch {
      toast.error("Не удалось удалить фавикон")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Настройки сайта</h2>
      <Card>
        <CardHeader>
          <CardTitle>Фавикон</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Текущий фавикон</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted border border-border">
                {hasFavicon ? (
                  <img
                    key={faviconVersion}
                    src={`/api/site/favicon?ts=${faviconVersion}`}
                    alt="Favicon preview"
                    className="h-full w-full object-contain"
                    onError={() => setHasFavicon(false)}
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground text-center px-1">
                    Используется фавикон по умолчанию
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Загрузите PNG/WebP/SVG логотип. Он будет автоматически преобразован в квадратный фавикон 32×32 px. Если
              удалить кастомный фавикон, вернётся значение по умолчанию из <code>public/favicon.ico</code>.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Загрузить новый фавикон</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUpload(file)
                  e.target.value = ""
                }
              }}
              disabled={uploading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!hasFavicon || deleting}
              onClick={() => {
                void handleDelete()
              }}
            >
              Сбросить до дефолтного
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

