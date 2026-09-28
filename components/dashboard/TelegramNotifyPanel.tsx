"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

export function TelegramNotifyPanel() {
  const [status, setStatus] = useState<Status | null>(null)
  const [botToken, setBotToken] = useState("")
  const [chatId, setChatId] = useState("")
  const [clearToken, setClearToken] = useState(false)
  const [clearChatId, setClearChatId] = useState(false)
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)

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

  const save = async () => {
    setBusy(true)
    try {
      const token = getToken()
      const body: {
        botToken?: string | null
        chatId?: string | null
        keepToken?: boolean
        keepChatId?: boolean
      } = {}

      if (clearToken) {
        body.botToken = null
      } else if (botToken.trim()) {
        body.botToken = botToken.trim()
      } else {
        body.keepToken = true
      }

      if (clearChatId) {
        body.chatId = null
      } else if (chatId.trim()) {
        body.chatId = chatId.trim()
      } else {
        body.keepChatId = true
      }

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
        return
      }
      setStatus(json.data ?? null)
      setBotToken("")
      setChatId("")
      setClearToken(false)
      setClearChatId(false)
      toast.success("Настройки Telegram сохранены (зашифрованы в БД)")
    } catch {
      toast.error("Ошибка сети при сохранении")
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
      toast.success("Тестовое сообщение отправлено в Telegram")
      await loadStatus()
    } catch {
      toast.error("Ошибка сети при тесте Telegram")
    } finally {
      setTesting(false)
    }
  }

  const sourceLabel =
    status?.source === "admin"
      ? "админка (шифр)"
      : status?.source === "env"
        ? ".env"
        : status?.source === "mixed"
          ? "смешанный (админка + .env)"
          : "не настроено"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления Telegram</CardTitle>
        <CardDescription>
          Заявки с форм уходят в Telegram. Токен и chat id можно задать здесь — они хранятся в БД{" "}
          <strong>в зашифрованном виде</strong> (ключ <code className="text-xs">SECRETS_ENCRYPTION_KEY</code> только в{" "}
          <code className="text-xs">.env</code>). Пустые поля при сохранении не затирают текущие значения. Fallback:{" "}
          <code className="text-xs">TELEGRAM_BOT_TOKEN</code> / <code className="text-xs">TELEGRAM_CHAT_ID</code> в .env.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            Шифрование:{" "}
            {status == null ? (
              "…"
            ) : status.encryptionReady ? (
              <span className="font-medium text-foreground">готово</span>
            ) : (
              <span className="font-medium text-destructive">нужен SECRETS_ENCRYPTION_KEY в .env</span>
            )}
          </p>
          <p>
            Статус отправки:{" "}
            {status == null ? (
              "…"
            ) : status.configured ? (
              <span className="font-medium text-foreground">ок ({sourceLabel})</span>
            ) : (
              <span className="font-medium text-destructive">не настроено</span>
            )}
          </p>
          <p className="text-xs">
            Токен в админке: {status?.tokenInAdmin ? "задан" : "нет"}
            {" · "}
            Chat id в админке: {status?.chatIdInAdmin ? "задан" : "нет"}
            {" · "}
            Токен в .env: {status?.tokenInEnv ? "да" : "нет"}
            {" · "}
            Chat id в .env: {status?.chatIdInEnv ? "да" : "нет"}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tg-bot-token">Bot token</Label>
          <Input
            id="tg-bot-token"
            type="password"
            autoComplete="off"
            placeholder={status?.tokenInAdmin ? "•••••••• (оставьте пустым, чтобы не менять)" : "123456:ABC…"}
            value={botToken}
            onChange={(e) => {
              setBotToken(e.target.value)
              setClearToken(false)
            }}
            disabled={busy || status?.encryptionReady === false}
          />
          {status?.tokenInAdmin ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearToken}
                onChange={(e) => setClearToken(e.target.checked)}
              />
              Удалить токен из админки
            </label>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tg-chat-id">Chat ID</Label>
          <Input
            id="tg-chat-id"
            type="text"
            autoComplete="off"
            placeholder={status?.chatIdInAdmin ? "•••••••• (оставьте пустым, чтобы не менять)" : "-100…"}
            value={chatId}
            onChange={(e) => {
              setChatId(e.target.value)
              setClearChatId(false)
            }}
            disabled={busy || status?.encryptionReady === false}
          />
          {status?.chatIdInAdmin ? (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={clearChatId}
                onChange={(e) => setClearChatId(e.target.checked)}
              />
              Удалить chat id из админки
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || status?.encryptionReady === false}
            onClick={() => void save()}
          >
            {busy ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={testing || status?.configured === false}
            onClick={() => void sendTest()}
          >
            {testing ? "Отправка…" : "Протестировать Telegram"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
