import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3"
import { getDb } from "@/lib/db"
import {
  tablePartners,
  tableChannels,
  tableAboutCards,
  tableContactIcons,
  tableBlogPosts,
  tableSiteSettings,
} from "@/lib/db/schema"
import { getS3Bucket, getS3Client } from "@/lib/s3/client"
import { isPartnerLogoS3Key } from "@/lib/s3/partner-logo-url"
import { parsePartnerCaseGalleryJson } from "@/lib/s3/partner-gallery-url"
import { isChannelAvatarS3Key } from "@/lib/s3/channel-avatar-url"
import { isAboutIconS3Key } from "@/lib/s3/about-icon-url"
import { isContactIconS3Key } from "@/lib/s3/contact-icon-url"
import { isBlogS3Key, tryExtractBlogKeyFromPublicUrl } from "@/lib/s3/blog-asset-url"
import { isSiteFaviconS3Key, isSiteLogoS3Key } from "@/lib/s3/site-asset-url"
import { parseBackgroundsJson, isBackgroundS3Key } from "@/lib/s3/background-slots"

/** Префиксы CMS-медиа (бэкапы БД не трогаем). */
const WIPE_PREFIXES = [
  "channels/",
  "partners/",
  "about-cards/",
  "contact-icons/",
  "blog/images/",
  "blog/videos/",
  "site/backgrounds/",
  "site/favicon-",
] as const

function shouldKeepKey(key: string): boolean {
  return isSiteLogoS3Key(key)
}

export function collectS3KeysFromDb(): string[] {
  const db = getDb()
  const keys = new Set<string>()

  for (const row of db.select({ logo_url: tablePartners.logo_url, case_gallery: tablePartners.case_gallery }).from(tablePartners).all()) {
    if (isPartnerLogoS3Key(row.logo_url)) keys.add(row.logo_url!.trim())
    for (const img of parsePartnerCaseGalleryJson(row.case_gallery)) {
      if (img.originalKey) keys.add(img.originalKey)
      if (img.thumbnailKey) keys.add(img.thumbnailKey)
    }
  }

  for (const row of db.select({ avatar: tableChannels.avatar }).from(tableChannels).all()) {
    if (isChannelAvatarS3Key(row.avatar)) keys.add(row.avatar!.trim())
  }

  for (const row of db.select({ icon_image: tableAboutCards.icon_image }).from(tableAboutCards).all()) {
    if (isAboutIconS3Key(row.icon_image)) keys.add(row.icon_image!.trim())
  }

  for (const row of db.select({ s3_key: tableContactIcons.s3_key }).from(tableContactIcons).all()) {
    if (isContactIconS3Key(row.s3_key)) keys.add(row.s3_key.trim())
  }

  for (const row of db.select({ cover_image_url: tableBlogPosts.cover_image_url, body_html_ru: tableBlogPosts.body_html_ru, body_html_en: tableBlogPosts.body_html_en }).from(tableBlogPosts).all()) {
    if (row.cover_image_url) {
      if (isBlogS3Key(row.cover_image_url)) keys.add(row.cover_image_url.trim())
      else {
        const extracted = tryExtractBlogKeyFromPublicUrl(row.cover_image_url)
        if (extracted) keys.add(extracted)
      }
    }
    for (const html of [row.body_html_ru, row.body_html_en]) {
      if (!html) continue
      const re = /(?:src|href)=["']([^"']+)["']/gi
      let m: RegExpExecArray | null
      while ((m = re.exec(html))) {
        const url = m[1]
        if (isBlogS3Key(url)) keys.add(url.trim())
        else {
          const extracted = tryExtractBlogKeyFromPublicUrl(url)
          if (extracted) keys.add(extracted)
        }
      }
    }
  }

  const settings = db.select().from(tableSiteSettings).limit(1).all()[0]
  if (settings) {
    if (isSiteFaviconS3Key(settings.favicon)) keys.add(settings.favicon!.trim())
    // logo intentionally NOT added
    const backgrounds = parseBackgroundsJson(settings.backgrounds)
    for (const value of Object.values(backgrounds)) {
      if (typeof value === "string" && isBackgroundS3Key(value)) keys.add(value.trim())
    }
  }

  return [...keys].filter((k) => !shouldKeepKey(k))
}

async function listKeysByPrefix(prefix: string): Promise<string[]> {
  const client = getS3Client()
  const bucket = getS3Bucket()
  const out: string[] = []
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    )
    for (const obj of page.Contents ?? []) {
      if (obj.Key && !shouldKeepKey(obj.Key)) out.push(obj.Key)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return out
}

export async function collectAllS3KeysToDelete(): Promise<string[]> {
  const fromDb = collectS3KeysFromDb()
  const fromPrefixes: string[] = []
  for (const prefix of WIPE_PREFIXES) {
    fromPrefixes.push(...(await listKeysByPrefix(prefix)))
  }
  return [...new Set([...fromDb, ...fromPrefixes])]
}

export async function estimateS3KeysToDelete(): Promise<number> {
  try {
    return (await collectAllS3KeysToDelete()).length
  } catch {
    return collectS3KeysFromDb().length
  }
}

export async function deleteS3Keys(keys: string[]): Promise<number> {
  if (keys.length === 0) return 0
  const client = getS3Client()
  const bucket = getS3Bucket()
  let deleted = 0
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000).filter((k) => !shouldKeepKey(k))
    if (chunk.length === 0) continue
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    )
    deleted += chunk.length
  }
  return deleted
}
