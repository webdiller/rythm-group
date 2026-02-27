"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

export function SiteSettingsEditor() {
  const [hasFavicon, setHasFavicon] = useState(false)
  const [faviconVersion, setFaviconVersion] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hasHeroBackground, setHasHeroBackground] = useState(false)
  const [heroBackgroundVersion, setHeroBackgroundVersion] = useState(0)
  const [uploadingHeroBackground, setUploadingHeroBackground] = useState(false)
  const [deletingHeroBackground, setDeletingHeroBackground] = useState(false)
  const [hasGlobalBackground, setHasGlobalBackground] = useState(false)
  const [globalBackgroundVersion, setGlobalBackgroundVersion] = useState(0)
  const [uploadingGlobalBackground, setUploadingGlobalBackground] = useState(false)
  const [deletingGlobalBackground, setDeletingGlobalBackground] = useState(false)
  const [heroAnimationEnabled, setHeroAnimationEnabled] = useState(true)
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("")
  const [dataProcessingPolicyUrl, setDataProcessingPolicyUrl] = useState("")
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [initialSettings, setInitialSettings] = useState<{
    heroAnimationEnabled: boolean
    privacyPolicyUrl: string
    dataProcessingPolicyUrl: string
  } | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = `/api/site/favicon?ts=${Date.now()}`
    img.onload = () => setHasFavicon(true)
    img.onerror = () => setHasFavicon(false)
  }, [])

  useEffect(() => {
    const checkBackgrounds = async () => {
      try {
        const [heroRes, globalRes] = await Promise.all([
          fetch("/api/site/backgrounds/hero", { cache: "no-store" }),
          fetch("/api/site/backgrounds/global", { cache: "no-store" }),
        ])

        setHasHeroBackground(heroRes.ok)
        setHasGlobalBackground(globalRes.ok)
      } catch {
        setHasHeroBackground(false)
        setHasGlobalBackground(false)
      }
    }

    void checkBackgrounds()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true)
      try {
        const res = await fetch("/api/site/settings")
        if (!res.ok) return

        const json = (await res.json()) as {
          data?: {
            heroAnimationEnabled?: boolean | null
            privacyPolicyUrl?: string | null
            dataProcessingPolicyUrl?: string | null
          } | null
        }

        const data = json.data ?? null
        const heroAnimation = data?.heroAnimationEnabled ?? true
        const privacy = data?.privacyPolicyUrl ?? ""
        const dataPolicy = data?.dataProcessingPolicyUrl ?? ""

        setHeroAnimationEnabled(heroAnimation)
        setPrivacyPolicyUrl(privacy)
        setDataProcessingPolicyUrl(dataPolicy)
        setInitialSettings({
          heroAnimationEnabled: heroAnimation,
          privacyPolicyUrl: privacy,
          dataProcessingPolicyUrl: dataPolicy,
        })
      } catch {
        // ignore, settings are optional
      } finally {
        setLoadingSettings(false)
      }
    }

    void loadSettings()
  }, [])

  const getToken = () => {
    return document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          heroAnimationEnabled,
          privacyPolicyUrl: privacyPolicyUrl || null,
          dataProcessingPolicyUrl: dataProcessingPolicyUrl || null,
        }),
      })

      if (!res.ok) {
        toast.error("Не удалось сохранить настройки сайта")
        return
      }

      toast.success("Настройки сайта обновлены")
      setInitialSettings({
        heroAnimationEnabled,
        privacyPolicyUrl,
        dataProcessingPolicyUrl,
      })
    } catch {
      toast.error("Не удалось сохранить настройки сайта")
    } finally {
      setSavingSettings(false)
    }
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

  const handleUploadHeroBackground = async (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    setUploadingHeroBackground(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/site/backgrounds/hero", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(json?.error ?? "Не удалось загрузить фон для hero")
        return
      }

      setHasHeroBackground(true)
      setHeroBackgroundVersion((v) => v + 1)
      toast.success("Фон hero обновлён")
    } catch {
      toast.error("Не удалось загрузить фон для hero")
    } finally {
      setUploadingHeroBackground(false)
    }
  }

  const handleDeleteHeroBackground = async () => {
    setDeletingHeroBackground(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/backgrounds/hero", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        toast.error("Не удалось удалить фон для hero")
        return
      }

      setHasHeroBackground(false)
      setHeroBackgroundVersion((v) => v + 1)
      toast.success("Фон hero сброшен")
    } catch {
      toast.error("Не удалось удалить фон для hero")
    } finally {
      setDeletingHeroBackground(false)
    }
  }

  const handleUploadGlobalBackground = async (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    setUploadingGlobalBackground(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/site/backgrounds/global", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(json?.error ?? "Не удалось загрузить общий фон")
        return
      }

      setHasGlobalBackground(true)
      setGlobalBackgroundVersion((v) => v + 1)
      toast.success("Общий фон обновлён")
    } catch {
      toast.error("Не удалось загрузить общий фон")
    } finally {
      setUploadingGlobalBackground(false)
    }
  }

  const handleDeleteGlobalBackground = async () => {
    setDeletingGlobalBackground(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/backgrounds/global", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        toast.error("Не удалось удалить общий фон")
        return
      }

      setHasGlobalBackground(false)
      setGlobalBackgroundVersion((v) => v + 1)
      toast.success("Общий фон сброшен")
    } catch {
      toast.error("Не удалось удалить общий фон")
    } finally {
      setDeletingGlobalBackground(false)
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
      <Card>
        <CardHeader>
          <CardTitle>Фоновые изображения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="hero_animation_enabled">Анимация Hero</Label>
              <p className="text-xs text-muted-foreground">
                Включает или отключает анимацию световых лучей и появления элементов на главном экране.
              </p>
            </div>
            <Switch
              id="hero_animation_enabled"
              checked={heroAnimationEnabled}
              onCheckedChange={setHeroAnimationEnabled}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Фон для Hero (16:9)</Label>
                <p className="text-xs text-muted-foreground">
                  Горизонтальное изображение (рекомендуется 16×9), форматы JPG/PNG/WebP, до 5 МБ. При загрузке изображение
                  будет сжато и обрезано под нужные пропорции.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasHeroBackground ? (
                  <img
                    key={heroBackgroundVersion}
                    src={`/api/site/backgrounds/hero?ts=${heroBackgroundVersion}`}
                    alt="Hero background preview"
                    className="h-full w-full object-cover"
                    onError={() => setHasHeroBackground(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Фон hero не загружен
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void handleUploadHeroBackground(file)
                    e.target.value = ""
                  }
                }}
                disabled={uploadingHeroBackground}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasHeroBackground || deletingHeroBackground}
                onClick={() => {
                  void handleDeleteHeroBackground()
                }}
              >
                Сбросить фон hero
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Общий фон сайта (9:16)</Label>
                <p className="text-xs text-muted-foreground">
                  Вертикальное изображение (рекомендуется 9×16), форматы JPG/PNG/WebP, до 5 МБ. Применяется ко всем
                  публичным секциям сайта, кроме hero и админки.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasGlobalBackground ? (
                  <img
                    key={globalBackgroundVersion}
                    src={`/api/site/backgrounds/global?ts=${globalBackgroundVersion}`}
                    alt="Global background preview"
                    className="h-full w-full object-cover"
                    onError={() => setHasGlobalBackground(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Общий фон не загружен
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void handleUploadGlobalBackground(file)
                    e.target.value = ""
                  }
                }}
                disabled={uploadingGlobalBackground}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasGlobalBackground || deletingGlobalBackground}
                onClick={() => {
                  void handleDeleteGlobalBackground()
                }}
              >
                Сбросить общий фон
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Политики и юридическая информация</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="privacy_policy_url">Ссылка на политику конфиденциальности</Label>
            <Input
              id="privacy_policy_url"
              type="url"
              value={privacyPolicyUrl}
              onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
              placeholder="https://example.com/privacy"
            />
            <p className="text-xs text-muted-foreground">
              Укажите полный URL на страницу с политикой конфиденциальности. Это может быть внешний сайт.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_policy_url">Ссылка на политику обработки данных</Label>
            <Input
              id="data_policy_url"
              type="url"
              value={dataProcessingPolicyUrl}
              onChange={(e) => setDataProcessingPolicyUrl(e.target.value)}
              placeholder="https://example.com/data-policy"
            />
            <p className="text-xs text-muted-foreground">
              Укажите полный URL на страницу с политикой обработки данных. Это может быть внешний сайт.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!initialSettings) return
                setPrivacyPolicyUrl(initialSettings.privacyPolicyUrl)
                setDataProcessingPolicyUrl(initialSettings.dataProcessingPolicyUrl)
              }}
              disabled={!initialSettings || loadingSettings || savingSettings}
            >
              Отменить
            </Button>
            <Button type="button" onClick={handleSaveSettings} disabled={savingSettings || loadingSettings}>
              {savingSettings ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

