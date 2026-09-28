"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

function getToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1]
}

export function TelegramNotifyPanel() {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const token = getToken()
      const res = await fetch("/api/admin/telegram-test", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        setConfigured(null)
        return
      }
      const json = (await res.json()) as { data?: { configured?: boolean } }
      setConfigured(Boolean(json.data?.configured))
    } catch {
      setConfigured(null)
    }
  }, [])

  useEffect(() => {
    void loadStatus()
  }, [loadStatus])

  const sendTest = async () => {
    setBusy(true)
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
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Уведомления Telegram</CardTitle>
        <CardDescription>
          Заявки с форм контактов уходят в Telegram. Токен бота и chat id задаются только в{" "}
          <code className="text-xs">.env</code>: <code className="text-xs">TELEGRAM_BOT_TOKEN</code>,{" "}
          <code className="text-xs">TELEGRAM_CHAT_ID</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Статус:{" "}
          {configured == null ? (
            <span>неизвестно</span>
          ) : configured ? (
            <span className="font-medium text-foreground">настроено</span>
          ) : (
            <span className="font-medium text-destructive">не настроено (добавьте переменные в .env и перезапустите приложение)</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={busy || configured === false}
          onClick={() => void sendTest()}
        >
          {busy ? "Отправка…" : "Протестировать Telegram"}
        </Button>
      </CardContent>
    </Card>
  )
}
