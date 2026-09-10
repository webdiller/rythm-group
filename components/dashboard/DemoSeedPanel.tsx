"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { DEMO_SEED_CONFIRM_PHRASE, type DemoSeedDryRunResult, type DemoSeedExecuteResult } from "@/lib/demo-seed/types"

function getToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1]
}

export function DemoSeedPanel() {
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [dryRun, setDryRun] = useState<DemoSeedDryRunResult | null>(null)
  const [lastResult, setLastResult] = useState<DemoSeedExecuteResult | null>(null)

  const runDryRun = async () => {
    setBusy(true)
    setLastResult(null)
    try {
      const token = getToken()
      const res = await fetch("/api/admin/demo-seed", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        toast.error("Не удалось выполнить dry-run")
        return
      }
      const json = (await res.json()) as { data?: DemoSeedDryRunResult }
      if (!json.data) {
        toast.error("Пустой ответ dry-run")
        return
      }
      setDryRun(json.data)
      if (!json.data.allowed) {
        toast.message("Демо-сид выключен: добавьте ALLOW_DEMO_SEED=1 в .env")
      } else if (!json.data.integrityOk) {
        toast.error("Проверка целостности не пройдена — см. отчёт ниже")
      } else {
        toast.success("Dry-run готов: целостность OK")
      }
    } catch {
      toast.error("Ошибка dry-run")
    } finally {
      setBusy(false)
    }
  }

  const runExecute = async () => {
    if (confirm !== DEMO_SEED_CONFIRM_PHRASE) {
      toast.error(`Введите ${DEMO_SEED_CONFIRM_PHRASE} для подтверждения`)
      return
    }
    if (!dryRun?.integrityOk || !dryRun.allowed) {
      toast.error("Сначала успешный dry-run с зелёной целостностью")
      return
    }
    if (
      !window.confirm(
        "Будут удалены CMS-данные и связанные объекты в S3 (логотип сохранится). Продолжить?",
      )
    ) {
      return
    }

    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch("/api/admin/demo-seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confirm: DEMO_SEED_CONFIRM_PHRASE }),
      })
      const json = (await res.json().catch(() => null)) as {
        data?: DemoSeedExecuteResult
        message?: string
        error?: string
      } | null
      if (!res.ok) {
        toast.error(json?.message ?? json?.error ?? "Генерация не удалась")
        return
      }
      if (json?.data) {
        setLastResult(json.data)
        setConfirm("")
        toast.success(
          `Готово. S3 удалено: ${json.data.deletedS3Keys}. Логотип сохранён: ${json.data.keptLogo ? "да" : "нет (не было)"}`,
        )
      }
    } catch {
      toast.error("Ошибка генерации")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Демо-данные (опасно)</CardTitle>
        <CardDescription>
          Удаляет контент CMS и связанные файлы в S3, затем создаёт тестовые записи (RU/EN). Поле
          логотипа сохраняется. Требуется <code className="text-xs">ALLOW_DEMO_SEED=1</code> в{" "}
          <code className="text-xs">.env</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void runDryRun()}>
            {busy ? "…" : "1. Dry-run (проверка)"}
          </Button>
        </div>

        {dryRun ? (
          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium">
              Целостность:{" "}
              <span className={dryRun.integrityOk ? "text-green-600" : "text-destructive"}>
                {dryRun.integrityOk ? "OK" : "есть ошибки"}
              </span>
              {" · "}
              Разрешено: {dryRun.allowed ? "да" : "нет"}
            </p>
            <ul className="space-y-1 text-xs">
              {dryRun.integrity.map((c) => (
                <li key={c.id} className={c.ok ? "text-muted-foreground" : "text-destructive"}>
                  {c.ok ? "✓" : "✗"} {c.message}
                </li>
              ))}
            </ul>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground">План удаления (строки в БД):</p>
              <ul className="mt-1 columns-2 gap-x-4 sm:columns-3">
                {dryRun.plan.willDeleteTables.map((t) => (
                  <li key={t.table}>
                    {t.table}: {t.rows}
                  </li>
                ))}
              </ul>
              <p className="mt-2">
                S3 объектов к удалению (оценка):{" "}
                {dryRun.plan.willDeleteS3KeysEstimate < 0
                  ? "не удалось оценить"
                  : dryRun.plan.willDeleteS3KeysEstimate}
              </p>
              <p className="mt-1">Логотип будет сохранён (если есть в site_settings).</p>
              <p className="mt-2 font-medium text-foreground">Будет создано (примерно):</p>
              <ul className="mt-1 columns-2 gap-x-4 sm:columns-3">
                {Object.entries(dryRun.plan.willCreate).map(([k, v]) => (
                  <li key={k}>
                    {k}: {v < 0 ? "из i18n" : v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="demo-seed-confirm">
            Подтверждение — введите {DEMO_SEED_CONFIRM_PHRASE}
          </Label>
          <Input
            id="demo-seed-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={DEMO_SEED_CONFIRM_PHRASE}
            autoComplete="off"
            disabled={busy}
          />
          <Button
            type="button"
            variant="destructive"
            disabled={
              busy ||
              confirm !== DEMO_SEED_CONFIRM_PHRASE ||
              !dryRun?.integrityOk ||
              !dryRun.allowed
            }
            onClick={() => void runExecute()}
          >
            2. Сгенерировать демо-данные
          </Button>
        </div>

        {lastResult ? (
          <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Последний результат</p>
            <p>S3 удалено: {lastResult.deletedS3Keys}</p>
            <p>Логотип сохранён: {lastResult.keptLogo ? "да" : "нет"}</p>
            <ul className="mt-1 columns-2 gap-x-4">
              {Object.entries(lastResult.created).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
