"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import {
  LOCAL_SEED_CONFIRM_PHRASE,
  type LocalSeedDryRunResult,
  type LocalSeedExecuteResult,
} from "@/lib/local-seed/types"

function getToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="))
    ?.split("=")[1]
}

type BusyPhase = "check" | "import" | null

export function LocalDataSeedPanel() {
  const [busy, setBusy] = useState<BusyPhase>(null)
  const [confirm, setConfirm] = useState("")
  const [dryRun, setDryRun] = useState<LocalSeedDryRunResult | null>(null)
  const [lastResult, setLastResult] = useState<LocalSeedExecuteResult | null>(null)

  const runDryRun = async () => {
    setBusy("check")
    setLastResult(null)
    try {
      const token = getToken()
      const res = await fetch("/api/admin/local-seed", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        toast.error("Не удалось выполнить проверку")
        return
      }
      const json = (await res.json()) as { data?: LocalSeedDryRunResult }
      if (!json.data) {
        toast.error("Пустой ответ")
        return
      }
      setDryRun(json.data)
      if (!json.data.allowed) {
        toast.message("Импорт выключен: добавьте ALLOW_DEMO_SEED=1 в .env")
      } else if (!json.data.ready) {
        toast.error("Файл scripts/data.local.json не найден или пуст")
      } else if (json.data.plan.avatarsMissing.length > 0) {
        toast.message(`Проверка OK, но нет файлов: ${json.data.plan.avatarsMissing.length}`)
      } else {
        toast.success("Проверка OK — можно импортировать")
      }
    } catch {
      toast.error("Ошибка проверки")
    } finally {
      setBusy(null)
    }
  }

  const runExecute = async () => {
    if (confirm !== LOCAL_SEED_CONFIRM_PHRASE) {
      toast.error(`Введите ${LOCAL_SEED_CONFIRM_PHRASE} для подтверждения`)
      return
    }
    if (!dryRun?.ready || !dryRun.allowed) {
      toast.error("Сначала успешная проверка")
      return
    }
    if (
      !window.confirm(
        "Будут заменены каналы, партнёры, about, FAQ, formats и часть переводов. Продолжить?",
      )
    ) {
      return
    }

    setBusy("import")
    try {
      const token = getToken()
      const res = await fetch("/api/admin/local-seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ confirm: LOCAL_SEED_CONFIRM_PHRASE }),
      })
      const json = (await res.json().catch(() => null)) as {
        data?: LocalSeedExecuteResult
        message?: string
        error?: string
      } | null
      if (!res.ok) {
        toast.error(json?.message ?? json?.error ?? "Импорт не удался")
        return
      }
      if (json?.data) {
        setLastResult(json.data)
        setConfirm("")
        const skipped = json.data.skippedAvatars.length
        toast.success(
          skipped > 0
            ? `Импорт готов. Пропущено аватаров: ${skipped}`
            : "Импорт из data.local.json выполнен",
        )
      }
    } catch {
      toast.error("Ошибка импорта")
    } finally {
      setBusy(null)
    }
  }

  const isBusy = busy != null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Импорт из data.local.json</CardTitle>
        <CardDescription>
          Заменяет каналы, партнёров (логотипы), about, FAQ, formats и заголовки stats/about.
          Аватары берутся из <code className="text-xs">public/avatars</code>. Нужен{" "}
          <code className="text-xs">ALLOW_DEMO_SEED=1</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {busy === "import" ? (
          <div
            className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-3 text-sm"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-foreground" />
            <div>
              <p className="font-medium text-foreground">Идёт посев локальных данных…</p>
              <p className="text-xs text-muted-foreground">
                Загрузка аватаров в S3 и запись в БД. Не закрывайте страницу.
              </p>
            </div>
          </div>
        ) : null}

        {busy === "check" ? (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Проверка файла и аватаров…
          </div>
        ) : null}

        <Button type="button" variant="outline" disabled={isBusy} onClick={() => void runDryRun()}>
          {busy === "check" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Проверка…
            </>
          ) : (
            "1. Проверить файл"
          )}
        </Button>

        {dryRun ? (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <p>
              Файл:{" "}
              <span className={dryRun.plan.dataFileExists ? "text-green-600" : "text-destructive"}>
                {dryRun.plan.dataFileExists ? "найден" : "нет"}
              </span>
              {" · "}
              Разрешено: {dryRun.allowed ? "да" : "нет"}
            </p>
            <p className="text-xs text-muted-foreground">
              В файле: каналов {dryRun.plan.channelsInFile}, партнёров {dryRun.plan.partnersInFile},
              аватаров найдено {dryRun.plan.avatarsFound}
              {dryRun.plan.avatarsMissing.length > 0
                ? `, отсутствует ${dryRun.plan.avatarsMissing.length}`
                : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Заменить в БД: каналы {dryRun.plan.willReplace.channels}, партнёры{" "}
              {dryRun.plan.willReplace.partners}, about {dryRun.plan.willReplace.about_cards}, FAQ{" "}
              {dryRun.plan.willReplace.affiliate_faq}, formats{" "}
              {dryRun.plan.willReplace.affiliate_formats}
            </p>
            {dryRun.plan.avatarsMissing.length > 0 ? (
              <ul className="max-h-24 overflow-auto text-xs text-destructive">
                {dryRun.plan.avatarsMissing.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="local-seed-confirm">
            Подтверждение — введите {LOCAL_SEED_CONFIRM_PHRASE}
          </Label>
          <Input
            id="local-seed-confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={LOCAL_SEED_CONFIRM_PHRASE}
            autoComplete="off"
            disabled={isBusy}
          />
          <Button
            type="button"
            disabled={
              isBusy ||
              confirm !== LOCAL_SEED_CONFIRM_PHRASE ||
              !dryRun?.ready ||
              !dryRun.allowed
            }
            onClick={() => void runExecute()}
          >
            {busy === "import" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Импорт…
              </>
            ) : (
              "2. Импортировать"
            )}
          </Button>
        </div>

        {lastResult ? (
          <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Результат</p>
            <p>
              Удалено S3: каналы {lastResult.deletedChannelAvatars}, лого партнёров{" "}
              {lastResult.deletedPartnerLogos}
            </p>
            <ul className="mt-1 columns-2 gap-x-4">
              {Object.entries(lastResult.created).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
            {lastResult.skippedAvatars.length > 0 ? (
              <p className="mt-1 text-destructive">
                Без файла: {lastResult.skippedAvatars.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
