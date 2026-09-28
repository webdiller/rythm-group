"use client"

import { useCallback, useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function getToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1]
}

type Status = {
  configured: boolean
  encryptionReady: boolean
  tokenInAdmin: boolean
  chatIdInAdmin: boolean
  tokenInEnv: boolean
  chatIdInEnv: boolean
  source: "admin" | "env" | "mixed" | "none"
}

type ClearTarget = "token" | "chatId" | null

function StatusFlag({ ok, label }: { ok: boolean | undefined; label: string }) {
  if (ok == null) return <span>{label}: …</span>
  return (
    <span>
      {label}:{" "}
      <span className={ok ? "font-medium text-green-600 dark:text-green-500" : "text-muted-foreground"}>
        {ok ? "задан" : "нет"}
      </span>
    </span>
  )
}

export function TelegramNotifyPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [botToken, setBotToken] = useState("")
  const [chatId, setChatId] = useState("")
  const [showToken, setShowToken] = useState(false)
  const [showChatId, setShowChatId] = useState(false)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [clearTarget, setClearTarget] = useState<ClearTarget>(null)

  const loadStatus = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/telegram-settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        setStatus(null)
        return
      }
      const json = (await res.json()) as { data?: Status }
      setStatus(json.data ?? null)
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const putSettings = async (body: {
    botToken?: string | null
    chatId?: string | null
    keepToken?: boolean
    keepChatId?: boolean
  }) => {
    const token = getToken()
    const res = await fetch("/api/admin/telegram-settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string; hint?: string; data?: Status }
    if (!res.ok) {
      toast.error(json.error || "Не удалось сохранить")
      if (json.hint) toast.message(json.hint)
      return false
    }
    setStatus(json.data ?? null)
    return true
  }

  const save = async () => {
    setBusy(true)
    try {
      const body: {
        botToken?: string | null
        chatId?: string | null
        keepToken?: boolean
        keepChatId?: boolean
      } = {}

      if (botToken.trim()) {
        body.botToken = botToken.trim()
      } else {
        body.keepToken = true
      }

      if (chatId.trim()) {
        body.chatId = chatId.trim()
      } else {
        body.keepChatId = true
      }

      const ok = await putSettings(body)
      if (!ok) return
      setBotToken("")
      setChatId("")
      toast.success("Сохранено")
    } catch {
      toast.error("Ошибка сети при сохранении")
    } finally {
      setBusy(false)
    }
  }

  const confirmClear = async () => {
    if (!clearTarget) return
    setBusy(true)
    try {
      const body =
        clearTarget === "token"
          ? { botToken: null as null, keepChatId: true }
          : { chatId: null as null, keepToken: true }
      const ok = await putSettings(body)
      if (!ok) return
      if (clearTarget === "token") setBotToken("")
      else setChatId("")
      toast.success(clearTarget === "token" ? "Токен удалён из админки" : "Chat ID удалён из админки")
      setClearTarget(null)
    } catch {
      toast.error("Ошибка сети при удалении")
    } finally {
      setBusy(false)
    }
  }

  const sendTest = async () => {
    setTesting(true)
    try {
      const token = getToken()
      const res = await fetch("/api/admin/telegram-test", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string; hint?: string }
      if (!res.ok) {
        toast.error(json.error || "Не удалось отправить тест")
        if (json.hint) toast.message(json.hint)
        return
      }
      toast.success("Тестовое сообщение отправлено")
      await loadStatus()
    } catch {
      toast.error("Ошибка сети при тесте Telegram")
    } finally {
      setTesting(false)
    }
  }

  const sourceLabel =
    status?.source === "admin"
      ? "админка"
      : status?.source === "env"
        ? ".env"
        : status?.source === "mixed"
          ? "смешанный"
          : null

  const fieldsDisabled = busy || status?.encryptionReady === false

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления Telegram</CardTitle>
        <CardDescription>
          Заявки с форм уходят в Telegram. Значения в админке шифруются ключом{" "}
          <code className="text-xs">SECRETS_ENCRYPTION_KEY</code>. Пустые поля не затирают сохранённое.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Шифрование:{" "}
            {status == null ? (
              "…"
            ) : status.encryptionReady ? (
              <span className="font-medium text-green-600 dark:text-green-500">готово</span>
            ) : (
              <span className="font-medium text-destructive">нужен SECRETS_ENCRYPTION_KEY</span>
            )}
            {" · "}
            Отправка:{" "}
            {status == null ? (
              "…"
            ) : status.configured ? (
              <span className="font-medium text-green-600 dark:text-green-500">
                ок{sourceLabel ? ` (${sourceLabel})` : ""}
              </span>
            ) : (
              <span className="font-medium text-destructive">не настроено</span>
            )}
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <StatusFlag ok={status?.tokenInAdmin} label="Токен" />
            <StatusFlag ok={status?.chatIdInAdmin} label="Chat ID" />
            <StatusFlag ok={status?.tokenInEnv} label="Токен .env" />
            <StatusFlag ok={status?.chatIdInEnv} label="Chat ID .env" />
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tg-bot-token">Bot token</Label>
          <div className="flex items-center gap-2">
            <Input
              id="tg-bot-token"
              type={showToken ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder={status?.tokenInAdmin ? "•••••••• (оставьте пустым, чтобы не менять)" : "123456:ABC…"}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              disabled={fieldsDisabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label={showToken ? "Скрыть токен" : "Показать токен"}
              onClick={() => setShowToken((v) => !v)}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {status?.tokenInAdmin ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={fieldsDisabled}
              onClick={() => setClearTarget("token")}
            >
              Удалить токен из админки
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tg-chat-id">Chat ID</Label>
          <div className="flex items-center gap-2">
            <Input
              id="tg-chat-id"
              type={showChatId ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              placeholder={status?.chatIdInAdmin ? "•••••••• (оставьте пустым, чтобы не менять)" : "-100…"}
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              disabled={fieldsDisabled}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label={showChatId ? "Скрыть chat id" : "Показать chat id"}
              onClick={() => setShowChatId((v) => !v)}
            >
              {showChatId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {status?.chatIdInAdmin ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-destructive hover:bg-transparent hover:text-destructive"
              disabled={fieldsDisabled}
              onClick={() => setClearTarget("chatId")}
            >
              Удалить chat id из админки
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={fieldsDisabled} onClick={() => void save()}>
            {busy && clearTarget == null ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testing || status?.configured === false}
            onClick={() => void sendTest()}
          >
            {testing ? "Отправка…" : "Протестировать"}
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={clearTarget != null} onOpenChange={(open) => !open && setClearTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {clearTarget === "token" ? "Удалить токен из админки?" : "Удалить chat id из админки?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearTarget === "token"
                ? "Зашифрованный bot token будет удалён из БД. Если токен есть в .env — он останется как fallback."
                : "Зашифрованный chat id будет удалён из БД. Если chat id есть в .env — он останется как fallback."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault()
                void confirmClear()
              }}
            >
              {busy ? "Удаление…" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
