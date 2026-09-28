import { isSiteFaviconS3Key, isSiteLogoS3Key } from "@/lib/s3/site-asset-url"
import { parseBackgroundsJson, serializeBackgroundsMap } from "@/lib/s3/background-slots"

/** В JSON API не отдаём base64 и зашифрованные секреты. */
export function sanitizeSiteSettingsBranding<
  T extends {
    logo?: string | null
    favicon?: string | null
    backgrounds?: string | null
    telegram_bot_token_enc?: string | null
    telegram_chat_id_enc?: string | null
  },
>(row: T): Omit<T, "telegram_bot_token_enc" | "telegram_chat_id_enc"> & {
  telegram_bot_token_enc?: never
  telegram_chat_id_enc?: never
} {
  const backgroundsRaw = row.backgrounds
  const backgrounds = backgroundsRaw == null || backgroundsRaw === "" ? null : serializeBackgroundsMap(parseBackgroundsJson(backgroundsRaw))

  const { telegram_bot_token_enc: _t, telegram_chat_id_enc: _c, ...rest } = row

  return {
    ...rest,
    logo: isSiteLogoS3Key(row.logo) ? row.logo!.trim() : null,
    favicon: isSiteFaviconS3Key(row.favicon) ? row.favicon!.trim() : null,
    backgrounds,
  } as Omit<T, "telegram_bot_token_enc" | "telegram_chat_id_enc"> & {
    telegram_bot_token_enc?: never
    telegram_chat_id_enc?: never
  }
}
