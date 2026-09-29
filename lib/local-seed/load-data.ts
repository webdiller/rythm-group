import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { z } from "zod"

const CardSchema = z.object({
  icon: z.string(),
  title: z.string(),
  description: z.string(),
})

const StatsBlockSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  stats: z.array(z.object({ value: z.string(), label: z.string() })),
})

const ChannelSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  url: z.string(),
  subscribers: z.number(),
  reach: z.number(),
  localAvatar: z.string().optional(),
})

const PartnerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  url: z.string(),
  localAvatar: z.string().optional(),
})

export const LocalDataFileSchema = z.object({
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    }),
  ),
  formats: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    ),
  }),
  about_ru: z.object({
    title: z.string(),
    subtitle: z.string(),
    cards: z.array(CardSchema),
  }),
  about_en: z.object({
    title: z.string(),
    subtitle: z.string(),
    cards: z.array(CardSchema),
  }),
  stats_ru: StatsBlockSchema,
  stats_en: StatsBlockSchema,
  channels: z.array(ChannelSchema).min(1),
  partners: z.array(PartnerSchema).default([]),
})

export type LocalDataFile = z.infer<typeof LocalDataFileSchema>

export function getLocalDataFilePath(): string {
  return path.join(process.cwd(), "scripts", "data.local.json")
}

export function getAvatarsDirPath(): string {
  return path.join(process.cwd(), "public", "avatars")
}

export function loadLocalDataFile(): LocalDataFile {
  const filePath = getLocalDataFilePath()
  if (!existsSync(filePath)) {
    throw new Error(`LOCAL_DATA_MISSING: ${filePath}`)
  }
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as unknown
  const parsed = LocalDataFileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`LOCAL_DATA_INVALID: ${parsed.error.message}`)
  }
  return parsed.data
}

/** Resolve file under public/; accepts "avatars/channel_19.webp" or "channel_19.webp". */
export function resolveAvatarAbsolutePath(localAvatar: string | undefined): string | null {
  if (!localAvatar?.trim()) return null
  const normalized = localAvatar.replace(/\\/g, "/").replace(/^\/+/, "")
  const relative = normalized.startsWith("avatars/")
    ? normalized.slice("avatars/".length)
    : normalized
  const abs = path.join(getAvatarsDirPath(), relative)
  return existsSync(abs) ? abs : null
}

export function listAvatarFilenames(): string[] {
  const dir = getAvatarsDirPath()
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((f) => /\.(webp|png|jpe?g)$/i.test(f))
}

export function formatChannelMetric(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0"
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, "")}M`
  }
  if (n >= 1000) {
    const v = n / 1000
    return `${Number.isInteger(v) ? v : v.toFixed(1).replace(/\.0$/, "")}K`
  }
  return String(Math.round(n))
}

/** Map JSON icon ids like "target" → Lucide whitelist name "Target". */
export function normalizeAboutIcon(icon: string): string {
  const trimmed = icon.trim()
  if (!trimmed) return "Target"
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}
