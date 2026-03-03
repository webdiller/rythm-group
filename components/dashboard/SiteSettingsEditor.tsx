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
  const [hasHeroBackgroundLight, setHasHeroBackgroundLight] = useState(false)
  const [heroBackgroundLightVersion, setHeroBackgroundLightVersion] = useState(0)
  const [uploadingHeroBackgroundLight, setUploadingHeroBackgroundLight] = useState(false)
  const [deletingHeroBackgroundLight, setDeletingHeroBackgroundLight] = useState(false)
  const [hasHeroBackgroundDark, setHasHeroBackgroundDark] = useState(false)
  const [heroBackgroundDarkVersion, setHeroBackgroundDarkVersion] = useState(0)
  const [uploadingHeroBackgroundDark, setUploadingHeroBackgroundDark] = useState(false)
  const [deletingHeroBackgroundDark, setDeletingHeroBackgroundDark] = useState(false)
  const [hasGlobalBackground, setHasGlobalBackground] = useState(false)
  const [globalBackgroundVersion, setGlobalBackgroundVersion] = useState(0)
  const [uploadingGlobalBackground, setUploadingGlobalBackground] = useState(false)
  const [deletingGlobalBackground, setDeletingGlobalBackground] = useState(false)
  const [hasGlobalBackgroundLight, setHasGlobalBackgroundLight] = useState(false)
  const [globalBackgroundLightVersion, setGlobalBackgroundLightVersion] = useState(0)
  const [uploadingGlobalBackgroundLight, setUploadingGlobalBackgroundLight] = useState(false)
  const [deletingGlobalBackgroundLight, setDeletingGlobalBackgroundLight] = useState(false)
  const [hasGlobalBackgroundDark, setHasGlobalBackgroundDark] = useState(false)
  const [globalBackgroundDarkVersion, setGlobalBackgroundDarkVersion] = useState(0)
  const [uploadingGlobalBackgroundDark, setUploadingGlobalBackgroundDark] = useState(false)
  const [deletingGlobalBackgroundDark, setDeletingGlobalBackgroundDark] = useState(false)
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
        const [heroRes, heroLightRes, heroDarkRes, globalRes, globalLightRes, globalDarkRes] =
          await Promise.all([
            fetch("/api/site/backgrounds/hero", { cache: "no-store" }),
            fetch("/api/site/backgrounds/hero?theme=light", { cache: "no-store" }),
            fetch("/api/site/backgrounds/hero?theme=dark", { cache: "no-store" }),
            fetch("/api/site/backgrounds/global", { cache: "no-store" }),
            fetch("/api/site/backgrounds/global?theme=light", { cache: "no-store" }),
            fetch("/api/site/backgrounds/global?theme=dark", { cache: "no-store" }),
          ])

        setHasHeroBackground(heroRes.ok)
        setHasHeroBackgroundLight(heroLightRes.ok)
        setHasHeroBackgroundDark(heroDarkRes.ok)
        setHasGlobalBackground(globalRes.ok)
        setHasGlobalBackgroundLight(globalLightRes.ok)
        setHasGlobalBackgroundDark(globalDarkRes.ok)
      } catch {
        setHasHeroBackground(false)
        setHasHeroBackgroundLight(false)
        setHasHeroBackgroundDark(false)
        setHasGlobalBackground(false)
        setHasGlobalBackgroundLight(false)
        setHasGlobalBackgroundDark(false)
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

  const handleUploadHeroBackgroundWithTheme = async (file: File, theme: "light" | "dark") => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    const setUploadingFn =
      theme === "light" ? setUploadingHeroBackgroundLight : setUploadingHeroBackgroundDark

    setUploadingFn(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/site/backgrounds/hero?theme=${theme}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(json?.error ?? "Не удалось загрузить фон для hero")
        return
      }

      if (theme === "light") {
        setHasHeroBackgroundLight(true)
        setHeroBackgroundLightVersion((v) => v + 1)
      } else {
        setHasHeroBackgroundDark(true)
        setHeroBackgroundDarkVersion((v) => v + 1)
      }
      toast.success(
        theme === "light" ? "Фон hero для светлой темы обновлён" : "Фон hero для тёмной темы обновлён",
      )
    } catch {
      toast.error("Не удалось загрузить фон для hero")
    } finally {
      setUploadingFn(false)
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

  const handleDeleteHeroBackgroundWithTheme = async (theme: "light" | "dark") => {
    const setDeletingFn =
      theme === "light" ? setDeletingHeroBackgroundLight : setDeletingHeroBackgroundDark

    setDeletingFn(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/site/backgrounds/hero?theme=${theme}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        toast.error("Не удалось удалить фон для hero")
        return
      }

      if (theme === "light") {
        setHasHeroBackgroundLight(false)
        setHeroBackgroundLightVersion((v) => v + 1)
      } else {
        setHasHeroBackgroundDark(false)
        setHeroBackgroundDarkVersion((v) => v + 1)
      }
      toast.success(
        theme === "light" ? "Фон hero для светлой темы сброшен" : "Фон hero для тёмной темы сброшен",
      )
    } catch {
      toast.error("Не удалось удалить фон для hero")
    } finally {
      setDeletingFn(false)
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

  const handleUploadGlobalBackgroundWithTheme = async (file: File, theme: "light" | "dark") => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    const setUploadingFn =
      theme === "light" ? setUploadingGlobalBackgroundLight : setUploadingGlobalBackgroundDark

    setUploadingFn(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`/api/site/backgrounds/global?theme=${theme}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(json?.error ?? "Не удалось загрузить общий фон")
        return
      }

      if (theme === "light") {
        setHasGlobalBackgroundLight(true)
        setGlobalBackgroundLightVersion((v) => v + 1)
      } else {
        setHasGlobalBackgroundDark(true)
        setGlobalBackgroundDarkVersion((v) => v + 1)
      }
      toast.success(
        theme === "light"
          ? "Общий фон для светлой темы обновлён"
          : "Общий фон для тёмной темы обновлён",
      )
    } catch {
      toast.error("Не удалось загрузить общий фон")
    } finally {
      setUploadingFn(false)
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

  const handleDeleteGlobalBackgroundWithTheme = async (theme: "light" | "dark") => {
    const setDeletingFn =
      theme === "light" ? setDeletingGlobalBackgroundLight : setDeletingGlobalBackgroundDark

    setDeletingFn(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/site/backgrounds/global?theme=${theme}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        toast.error("Не удалось удалить общий фон")
        return
      }

      if (theme === "light") {
        setHasGlobalBackgroundLight(false)
        setGlobalBackgroundLightVersion((v) => v + 1)
      } else {
        setHasGlobalBackgroundDark(false)
        setGlobalBackgroundDarkVersion((v) => v + 1)
      }
      toast.success(
        theme === "light"
          ? "Общий фон для светлой темы сброшен"
          : "Общий фон для тёмной темы сброшен",
      )
    } catch {
      toast.error("Не удалось удалить общий фон")
    } finally {
      setDeletingFn(false)
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
              <Label htmlFor="hero_animation_enabled">Анимация сайта</Label>
              <p className="text-xs text-muted-foreground">
                Включает или отключает анимацию световых лучей и появления элементов на сайте.
              </p>
            </div>
            <Switch
              id="hero_animation_enabled"
              checked={heroAnimationEnabled}
              onCheckedChange={setHeroAnimationEnabled}
            />
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Фон Hero для светлой темы (16:9)</Label>
                <p className="text-xs text-muted-foreground">
                  Используется, когда включена светлая тема. Если не задан, берётся основной фон Hero.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasHeroBackgroundLight ? (
                  <img
                    key={heroBackgroundLightVersion}
                    src={`/api/site/backgrounds/hero?theme=light&ts=${heroBackgroundLightVersion}`}
                    alt="Hero background preview (light theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasHeroBackgroundLight(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Фон hero для светлой темы не загружен
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
                    void handleUploadHeroBackgroundWithTheme(file, "light")
                    e.target.value = ""
                  }
                }}
                disabled={uploadingHeroBackgroundLight}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasHeroBackgroundLight || deletingHeroBackgroundLight}
                onClick={() => {
                  void handleDeleteHeroBackgroundWithTheme("light")
                }}
              >
                Сбросить фон hero (светлая тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Фон Hero для тёмной темы (16:9)</Label>
                <p className="text-xs text-muted-foreground">
                  Используется, когда включена тёмная тема. Если не задан, берётся основной фон Hero.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasHeroBackgroundDark ? (
                  <img
                    key={heroBackgroundDarkVersion}
                    src={`/api/site/backgrounds/hero?theme=dark&ts=${heroBackgroundDarkVersion}`}
                    alt="Hero background preview (dark theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasHeroBackgroundDark(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Фон hero для тёмной темы не загружен
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
                    void handleUploadHeroBackgroundWithTheme(file, "dark")
                    e.target.value = ""
                  }
                }}
                disabled={uploadingHeroBackgroundDark}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasHeroBackgroundDark || deletingHeroBackgroundDark}
                onClick={() => {
                  void handleDeleteHeroBackgroundWithTheme("dark")
                }}
              >
                Сбросить фон hero (тёмная тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Общий фон для светлой темы (9:16)</Label>
                <p className="text-xs text-muted-foreground">
                  Используется, когда включена светлая тема. Если не задан, берётся основной общий фон.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasGlobalBackgroundLight ? (
                  <img
                    key={globalBackgroundLightVersion}
                    src={`/api/site/backgrounds/global?theme=light&ts=${globalBackgroundLightVersion}`}
                    alt="Global background preview (light theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasGlobalBackgroundLight(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Общий фон для светлой темы не загружен
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
                    void handleUploadGlobalBackgroundWithTheme(file, "light")
                    e.target.value = ""
                  }
                }}
                disabled={uploadingGlobalBackgroundLight}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasGlobalBackgroundLight || deletingGlobalBackgroundLight}
                onClick={() => {
                  void handleDeleteGlobalBackgroundWithTheme("light")
                }}
              >
                Сбросить общий фон (светлая тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Общий фон для тёмной темы (9:16)</Label>
                <p className="text-xs text-muted-foreground">
                  Используется, когда включена тёмная тема. Если не задан, берётся основной общий фон.
                </p>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasGlobalBackgroundDark ? (
                  <img
                    key={globalBackgroundDarkVersion}
                    src={`/api/site/backgrounds/global?theme=dark&ts=${globalBackgroundDarkVersion}`}
                    alt="Global background preview (dark theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasGlobalBackgroundDark(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">
                    Общий фон для тёмной темы не загружен
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
                    void handleUploadGlobalBackgroundWithTheme(file, "dark")
                    e.target.value = ""
                  }
                }}
                disabled={uploadingGlobalBackgroundDark}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasGlobalBackgroundDark || deletingGlobalBackgroundDark}
                onClick={() => {
                  void handleDeleteGlobalBackgroundWithTheme("dark")
                }}
              >
                Сбросить общий фон (тёмная тема)
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

