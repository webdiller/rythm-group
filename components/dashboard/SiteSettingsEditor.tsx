"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { GripVertical } from "lucide-react"
import { toast } from "sonner"
import { DEFAULT_HEADER_NAV_ORDER, normalizeHeaderNavOrder, type HeaderNavItemId } from "@/lib/header-nav"
import { useLocale } from "@/lib/locale-context"
import { fallbackTranslations } from "@/lib/i18n"
import { getSiteFaviconSrc, getSiteLogoSrc } from "@/lib/s3/site-asset-url"
import {
  getBackgroundSrc,
  parseBackgroundsJson,
  resolveBackgroundSlot,
  type BackgroundSlot,
  type BackgroundsMap,
} from "@/lib/s3/background-slots"

function SortableNavList({ items, children }: { items: HeaderNavItemId[]; children: ReactNode }) {
  return (
    // @ts-ignore — occasional TS2786 between @dnd-kit/sortable and React 19 type packages
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  )
}

function SortableNavItem({
  id,
  labelRu,
  labelEn,
}: {
  id: HeaderNavItemId
  labelRu: string
  labelEn: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 }}
      className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2"
    >
      <span className="flex flex-col">
        <span className="text-sm">{labelRu}</span>
        <span className="text-xs text-muted-foreground">{labelEn}</span>
        <span className="text-xs text-muted-foreground">{id}</span>
      </span>
      <button
        type="button"
        className="inline-flex cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label="Перетащить для смены порядка"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </li>
  )
}

export function SiteSettingsEditor() {
  const { t } = useLocale()
  const [headerNavLabels, setHeaderNavLabels] = useState<
    Record<HeaderNavItemId, { ru: string; en: string }>
  >({
    about: { ru: fallbackTranslations.ru.nav.about, en: fallbackTranslations.en.nav.about },
    channels: { ru: fallbackTranslations.ru.nav.channels, en: fallbackTranslations.en.nav.channels },
    cases: { ru: fallbackTranslations.ru.nav.cases, en: fallbackTranslations.en.nav.cases },
    affiliate: { ru: fallbackTranslations.ru.nav.affiliate, en: fallbackTranslations.en.nav.affiliate },
    blog: {
      ru: fallbackTranslations.ru.nav.blog ?? fallbackTranslations.ru.blog.navLabel,
      en: fallbackTranslations.en.nav.blog ?? fallbackTranslations.en.blog.navLabel,
    },
    contacts: { ru: fallbackTranslations.ru.nav.contacts, en: fallbackTranslations.en.nav.contacts },
  })
  const [hasLogo, setHasLogo] = useState(false)
  const [logoKey, setLogoKey] = useState<string | null>(null)
  const [logoVersion, setLogoVersion] = useState(() => Date.now())
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [deletingLogo, setDeletingLogo] = useState(false)
  const [hasFavicon, setHasFavicon] = useState(false)
  const [faviconKey, setFaviconKey] = useState<string | null>(null)
  const [faviconVersion, setFaviconVersion] = useState(() => Date.now())
  const [backgroundKeys, setBackgroundKeys] = useState<BackgroundsMap>({})
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
  const [hasAffiliateHeroBackgroundLight, setHasAffiliateHeroBackgroundLight] = useState(false)
  const [affiliateHeroBackgroundLightVersion, setAffiliateHeroBackgroundLightVersion] = useState(0)
  const [uploadingAffiliateHeroBackgroundLight, setUploadingAffiliateHeroBackgroundLight] = useState(false)
  const [deletingAffiliateHeroBackgroundLight, setDeletingAffiliateHeroBackgroundLight] = useState(false)
  const [hasAffiliateHeroBackgroundDark, setHasAffiliateHeroBackgroundDark] = useState(false)
  const [affiliateHeroBackgroundDarkVersion, setAffiliateHeroBackgroundDarkVersion] = useState(0)
  const [uploadingAffiliateHeroBackgroundDark, setUploadingAffiliateHeroBackgroundDark] = useState(false)
  const [deletingAffiliateHeroBackgroundDark, setDeletingAffiliateHeroBackgroundDark] = useState(false)
  const [hasAffiliateGlobalBackgroundLight, setHasAffiliateGlobalBackgroundLight] = useState(false)
  const [affiliateGlobalBackgroundLightVersion, setAffiliateGlobalBackgroundLightVersion] = useState(0)
  const [uploadingAffiliateGlobalBackgroundLight, setUploadingAffiliateGlobalBackgroundLight] = useState(false)
  const [deletingAffiliateGlobalBackgroundLight, setDeletingAffiliateGlobalBackgroundLight] = useState(false)
  const [hasAffiliateGlobalBackgroundDark, setHasAffiliateGlobalBackgroundDark] = useState(false)
  const [affiliateGlobalBackgroundDarkVersion, setAffiliateGlobalBackgroundDarkVersion] = useState(0)
  const [uploadingAffiliateGlobalBackgroundDark, setUploadingAffiliateGlobalBackgroundDark] = useState(false)
  const [deletingAffiliateGlobalBackgroundDark, setDeletingAffiliateGlobalBackgroundDark] = useState(false)
  const [heroAnimationEnabled, setHeroAnimationEnabled] = useState(true)
  const [partnersDisplayMode, setPartnersDisplayMode] = useState<"name" | "logo" | "logoAndName">(
    "logoAndName",
  )
  const [channelsShowSubscribers, setChannelsShowSubscribers] = useState(true)
  const [channelsShowReach, setChannelsShowReach] = useState(true)
  const [channelsCardAlign, setChannelsCardAlign] = useState<"left" | "center" | "right">("left")
  const [contactLayout, setContactLayout] = useState<"formFirst" | "contactsFirst">("formFirst")
  const [contactFormHidden, setContactFormHidden] = useState(false)
  const [affiliateContactLayout, setAffiliateContactLayout] = useState<"formFirst" | "contactsFirst">("formFirst")
  const [affiliateContactFormHidden, setAffiliateContactFormHidden] = useState(false)
  const [blogShowDates, setBlogShowDates] = useState(true)
  const [affiliateShowBlogBlock, setAffiliateShowBlogBlock] = useState(true)
  const [pageBlogEnabled, setPageBlogEnabled] = useState(true)
  const [pageAffiliateEnabled, setPageAffiliateEnabled] = useState(true)
  const [sitePublished, setSitePublished] = useState(true)
  const [headerNavOrder, setHeaderNavOrder] = useState<HeaderNavItemId[]>([...DEFAULT_HEADER_NAV_ORDER])
  const [logoText, setLogoText] = useState("")
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("")
  const [dataProcessingPolicyUrl, setDataProcessingPolicyUrl] = useState("")
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [initialSettings, setInitialSettings] = useState<{
    logoText: string
    heroAnimationEnabled: boolean
    privacyPolicyUrl: string
    dataProcessingPolicyUrl: string
    partnersDisplayMode: "name" | "logo" | "logoAndName"
    channelsShowSubscribers: boolean
    channelsShowReach: boolean
    channelsCardAlign: "left" | "center" | "right"
    contactLayout: "formFirst" | "contactsFirst"
    contactFormHidden: boolean
    affiliateContactLayout: "formFirst" | "contactsFirst"
    affiliateContactFormHidden: boolean
    blogShowDates: boolean
    affiliateShowBlogBlock: boolean
    pageBlogEnabled: boolean
    pageAffiliateEnabled: boolean
    sitePublished: boolean
    headerNavOrder: HeaderNavItemId[]
  } | null>(null)

  useEffect(() => {
    const fallback = {
      about: { ru: fallbackTranslations.ru.nav.about, en: fallbackTranslations.en.nav.about },
      channels: { ru: fallbackTranslations.ru.nav.channels, en: fallbackTranslations.en.nav.channels },
      cases: { ru: fallbackTranslations.ru.nav.cases, en: fallbackTranslations.en.nav.cases },
      affiliate: { ru: fallbackTranslations.ru.nav.affiliate, en: fallbackTranslations.en.nav.affiliate },
      blog: {
        ru: fallbackTranslations.ru.nav.blog ?? fallbackTranslations.ru.blog.navLabel,
        en: fallbackTranslations.en.nav.blog ?? fallbackTranslations.en.blog.navLabel,
      },
      contacts: { ru: fallbackTranslations.ru.nav.contacts, en: fallbackTranslations.en.nav.contacts },
    } satisfies Record<HeaderNavItemId, { ru: string; en: string }>

    const applyRows = (
      locale: "ru" | "en",
      rows: Array<{ section: string; key: string; value: string }>,
      next: Record<HeaderNavItemId, { ru: string; en: string }>,
    ) => {
      const set = (id: HeaderNavItemId, value: string) => {
        if (!value?.trim()) return
        next[id] = { ...next[id], [locale]: value }
      }
      for (const row of rows) {
        if (row.section === "nav") {
          if (row.key === "about") set("about", row.value)
          if (row.key === "channels") set("channels", row.value)
          if (row.key === "cases") set("cases", row.value)
          if (row.key === "affiliate") set("affiliate", row.value)
          if (row.key === "blog") set("blog", row.value)
          if (row.key === "contacts") set("contacts", row.value)
        }
        if (row.section === "blog" && row.key === "navLabel" && !next.blog[locale].trim()) {
          set("blog", row.value)
        }
      }
    }

    const loadNavLabels = async () => {
      try {
        const [ruRes, enRes] = await Promise.all([
          fetch("/api/content/translations?locale=ru", { cache: "no-store" }),
          fetch("/api/content/translations?locale=en", { cache: "no-store" }),
        ])
        if (!ruRes.ok || !enRes.ok) return
        const ruJson = (await ruRes.json()) as { data?: Array<{ section: string; key: string; value: string }> }
        const enJson = (await enRes.json()) as { data?: Array<{ section: string; key: string; value: string }> }
        const next = { ...fallback }
        applyRows("ru", ruJson.data ?? [], next)
        applyRows("en", enJson.data ?? [], next)
        setHeaderNavLabels(next)
      } catch {
        setHeaderNavLabels(fallback)
      }
    }

    void loadNavLabels()
  }, [t.nav.about, t.nav.channels, t.nav.cases, t.nav.affiliate, t.nav.blog, t.nav.contacts, t.blog.navLabel])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleHeaderNavDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = headerNavOrder.findIndex((id) => id === active.id)
    const newIndex = headerNavOrder.findIndex((id) => id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    setHeaderNavOrder(arrayMove(headerNavOrder, oldIndex, newIndex))
  }

  useEffect(() => {
    const logo = new Image()
    logo.src = getSiteLogoSrc(logoKey, { cacheBust: Date.now() })
    logo.onload = () => setHasLogo(true)
    logo.onerror = () => setHasLogo(false)
  }, [logoKey])

  useEffect(() => {
    const img = new Image()
    img.src = getSiteFaviconSrc(faviconKey, { cacheBust: Date.now() })
    img.onload = () => setHasFavicon(true)
    img.onerror = () => setHasFavicon(false)
  }, [faviconKey])

  const applyBackgroundPresence = (p: Partial<Record<BackgroundSlot, boolean>>) => {
    setHasHeroBackground(Boolean(p.hero))
    setHasHeroBackgroundLight(Boolean(p.hero_light))
    setHasHeroBackgroundDark(Boolean(p.hero_dark))
    setHasGlobalBackground(Boolean(p.global))
    setHasGlobalBackgroundLight(Boolean(p.global_light))
    setHasGlobalBackgroundDark(Boolean(p.global_dark))
    setHasAffiliateHeroBackgroundLight(Boolean(p.hero_affiliate_light))
    setHasAffiliateHeroBackgroundDark(Boolean(p.hero_affiliate_dark))
    setHasAffiliateGlobalBackgroundLight(Boolean(p.global_affiliate_light))
    setHasAffiliateGlobalBackgroundDark(Boolean(p.global_affiliate_dark))
  }

  const bgPreview = (
    kind: "hero" | "global",
    theme?: "light" | "dark" | null,
    scope?: "affiliate" | null,
    cacheBust?: number,
  ) => {
    const slot = resolveBackgroundSlot(kind, theme, scope)
    return getBackgroundSrc(kind, {
      theme,
      scope,
      key: backgroundKeys[slot],
      cacheBust,
    })
  }

  const rememberBackgroundKey = (
    kind: "hero" | "global",
    theme: string | null | undefined,
    scope: string | null | undefined,
    key: string | null | undefined,
  ) => {
    const slot = resolveBackgroundSlot(kind, theme, scope)
    setBackgroundKeys((prev) => {
      const next = { ...prev }
      if (key) next[slot] = key
      else delete next[slot]
      return next
    })
  }

  useEffect(() => {
    const loadSettings = async () => {
      setLoadingSettings(true)
      try {
        const res = await fetch("/api/site/settings")
        if (!res.ok) return

        const json = (await res.json()) as {
          data?: {
            favicon?: string | null
            logo_text?: string | null
            logo?: string | null
            backgrounds?: string | null
            heroAnimationEnabled?: boolean | null
            privacyPolicyUrl?: string | null
            dataProcessingPolicyUrl?: string | null
            partnersDisplayMode?: "name" | "logo" | "logoAndName" | null
            channels_show_subscribers?: boolean | null
            channels_show_reach?: boolean | null
            channels_card_align?: "left" | "center" | "right" | null
            contactLayout?: "formFirst" | "contactsFirst" | null
            contactFormHidden?: boolean | null
            affiliate_contact_layout?: "formFirst" | "contactsFirst" | null
            affiliate_contact_form_hidden?: boolean | null
            blog_show_dates?: boolean | null
            affiliate_show_blog_block?: boolean | null
            page_blog_enabled?: boolean | null
            page_affiliate_enabled?: boolean | null
            site_published?: boolean | null
            headerNavOrder?: string | null
          } | null
          meta?: {
            background_presence?: Partial<Record<BackgroundSlot, boolean>>
          } | null
        }

        const data = json.data ?? null
        setLogoKey(data?.logo ?? null)
        setFaviconKey(data?.favicon ?? null)
        setHasLogo(Boolean(data?.logo))
        setHasFavicon(Boolean(data?.favicon))
        setBackgroundKeys(parseBackgroundsJson(data?.backgrounds))
        applyBackgroundPresence(json.meta?.background_presence ?? {})
        const logoTextValue = data?.logo_text ?? ""
        const heroAnimation = data?.heroAnimationEnabled ?? true
        const privacy = data?.privacyPolicyUrl ?? ""
        const dataPolicy = data?.dataProcessingPolicyUrl ?? ""
        const partnersMode = data?.partnersDisplayMode ?? "logoAndName"
        const channelsSubscribers = data?.channels_show_subscribers ?? true
        const channelsReach = data?.channels_show_reach ?? true
        const channelsAlign =
          data?.channels_card_align === "center" || data?.channels_card_align === "right"
            ? data.channels_card_align
            : "left"
        const layoutMode = data?.contactLayout ?? "formFirst"
        const formHidden = data?.contactFormHidden ?? false
        const affiliateLayoutMode = data?.affiliate_contact_layout ?? "formFirst"
        const affiliateFormHidden = data?.affiliate_contact_form_hidden ?? false
        const blogDates = data?.blog_show_dates ?? true
        const affBlog = data?.affiliate_show_blog_block ?? true
        const pageBlog = data?.page_blog_enabled ?? true
        const pageAffiliate = data?.page_affiliate_enabled ?? true
        const sitePublishedValue = data?.site_published ?? true
        const parsedHeaderNavOrder = (() => {
          try {
            if (!data?.headerNavOrder) return [...DEFAULT_HEADER_NAV_ORDER]
            return normalizeHeaderNavOrder(JSON.parse(data.headerNavOrder))
          } catch {
            return [...DEFAULT_HEADER_NAV_ORDER]
          }
        })()

        setLogoText(logoTextValue)
        setHeroAnimationEnabled(heroAnimation)
        setPrivacyPolicyUrl(privacy)
        setDataProcessingPolicyUrl(dataPolicy)
        setInitialSettings({
          heroAnimationEnabled: heroAnimation,
          logoText: logoTextValue,
          privacyPolicyUrl: privacy,
          dataProcessingPolicyUrl: dataPolicy,
          partnersDisplayMode: partnersMode,
          channelsShowSubscribers: channelsSubscribers,
          channelsShowReach: channelsReach,
          channelsCardAlign: channelsAlign,
          contactLayout: layoutMode,
          contactFormHidden: formHidden,
          affiliateContactLayout: affiliateLayoutMode,
          affiliateContactFormHidden: affiliateFormHidden,
          blogShowDates: blogDates,
          affiliateShowBlogBlock: affBlog,
          pageBlogEnabled: pageBlog,
          pageAffiliateEnabled: pageAffiliate,
          sitePublished: sitePublishedValue,
          headerNavOrder: parsedHeaderNavOrder,
        })
        setPartnersDisplayMode(partnersMode)
        setChannelsShowSubscribers(channelsSubscribers)
        setChannelsShowReach(channelsReach)
        setChannelsCardAlign(channelsAlign)
        setContactLayout(layoutMode)
        setContactFormHidden(formHidden)
        setAffiliateContactLayout(affiliateLayoutMode)
        setAffiliateContactFormHidden(affiliateFormHidden)
        setBlogShowDates(blogDates)
        setAffiliateShowBlogBlock(affBlog)
        setPageBlogEnabled(pageBlog)
        setPageAffiliateEnabled(pageAffiliate)
        setSitePublished(sitePublishedValue)
        setHeaderNavOrder(parsedHeaderNavOrder)
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

  const notifyMutationError = (message: string) => {
    toast.error(message)
  }

  const syncDocumentFavicon = (version: number, key?: string | null) => {
    const faviconHref = getSiteFaviconSrc(key ?? faviconKey, { cacheBust: version })
    const iconSelectors = ['link[rel="icon"]', 'link[rel="shortcut icon"]'] as const

    for (const selector of iconSelectors) {
      let link = document.head.querySelector(selector) as HTMLLinkElement | null
      if (!link) {
        link = document.createElement("link")
        link.rel = selector.includes("shortcut") ? "shortcut icon" : "icon"
        document.head.appendChild(link)
      }
      link.href = faviconHref
    }
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
          logo_text: logoText.trim() || null,
          heroAnimationEnabled,
          privacyPolicyUrl: privacyPolicyUrl || null,
          dataProcessingPolicyUrl: dataProcessingPolicyUrl || null,
          partnersDisplayMode,
          channels_show_subscribers: channelsShowSubscribers,
          channels_show_reach: channelsShowReach,
          channels_card_align: channelsCardAlign,
          contactLayout,
          contactFormHidden,
          affiliate_contact_layout: affiliateContactLayout,
          affiliate_contact_form_hidden: affiliateContactFormHidden,
          blog_show_dates: blogShowDates,
          affiliate_show_blog_block: affiliateShowBlogBlock,
          page_blog_enabled: pageBlogEnabled,
          page_affiliate_enabled: pageAffiliateEnabled,
          site_published: sitePublished,
          headerNavOrder,
        }),
      })

      if (!res.ok) {
        notifyMutationError("Не удалось сохранить настройки сайта")
        return
      }

      toast.success("Настройки сайта обновлены")
      setInitialSettings({
        logoText: logoText.trim(),
        heroAnimationEnabled,
        privacyPolicyUrl,
        dataProcessingPolicyUrl,
        partnersDisplayMode,
        channelsShowSubscribers,
        channelsShowReach,
        channelsCardAlign,
        contactLayout,
        contactFormHidden,
        affiliateContactLayout,
        affiliateContactFormHidden,
        blogShowDates,
        affiliateShowBlogBlock,
        pageBlogEnabled,
        pageAffiliateEnabled,
        sitePublished,
        headerNavOrder,
      })
    } catch {
      notifyMutationError("Не удалось сохранить настройки сайта")
    } finally {
      setSavingSettings(false)
    }
  }

  const handleUploadLogo = async (file: File) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    setUploadingLogo(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/site/logo", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      if (!res.ok) {
        notifyMutationError("Не удалось загрузить логотип")
        return
      }

      const json = (await res.json()) as { data?: { logo?: string | null } }
      setLogoKey(json.data?.logo ?? null)
      setHasLogo(true)
      setLogoVersion(Date.now())
      toast.success("Логотип обновлён")
    } catch {
      notifyMutationError("Не удалось загрузить логотип")
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteLogo = async () => {
    setDeletingLogo(true)
    try {
      const token = getToken()
      const res = await fetch("/api/site/logo", {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        notifyMutationError("Не удалось удалить логотип")
        return
      }

      setLogoKey(null)
      setHasLogo(false)
      setLogoVersion(Date.now())
      toast.success("Логотип сброшен до значения по умолчанию")
    } catch {
      notifyMutationError("Не удалось удалить логотип")
    } finally {
      setDeletingLogo(false)
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
        notifyMutationError("Не удалось загрузить фавикон")
        return
      }

      const json = (await res.json()) as { data?: { favicon?: string | null } }
      const nextKey = json.data?.favicon ?? null
      setFaviconKey(nextKey)
      setHasFavicon(true)
      const nextVersion = Date.now()
      setFaviconVersion(nextVersion)
      syncDocumentFavicon(nextVersion, nextKey)
      toast.success("Фавикон обновлён")
    } catch {
      notifyMutationError("Не удалось загрузить фавикон")
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

      const json = (await res.json().catch(() => null)) as { error?: string; key?: string } | null
      if (!res.ok) {
        notifyMutationError(json?.error ?? "Не удалось загрузить фон для hero")
        return
      }

      rememberBackgroundKey("hero", null, null, json?.key)
      setHasHeroBackground(true)
      setHeroBackgroundVersion((v) => v + 1)
      toast.success("Фон hero обновлён")
    } catch {
      notifyMutationError("Не удалось загрузить фон для hero")
    } finally {
      setUploadingHeroBackground(false)
    }
  }

  const handleUploadHeroBackgroundWithTheme = async (
    file: File,
    theme: "light" | "dark",
    scope: "landing" | "affiliate" = "landing",
  ) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    const setUploadingFn =
      scope === "affiliate"
        ? theme === "light"
          ? setUploadingAffiliateHeroBackgroundLight
          : setUploadingAffiliateHeroBackgroundDark
        : theme === "light"
          ? setUploadingHeroBackgroundLight
          : setUploadingHeroBackgroundDark

    setUploadingFn(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const scopeQuery = scope === "affiliate" ? "&scope=affiliate" : ""
      const res = await fetch(`/api/site/backgrounds/hero?theme=${theme}${scopeQuery}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      const json = (await res.json().catch(() => null)) as { error?: string; key?: string } | null
      if (!res.ok) {
        notifyMutationError(json?.error ?? "Не удалось загрузить фон для hero")
        return
      }

      rememberBackgroundKey("hero", theme, scope === "affiliate" ? "affiliate" : null, json?.key)
      if (theme === "light") {
        if (scope === "affiliate") {
          setHasAffiliateHeroBackgroundLight(true)
          setAffiliateHeroBackgroundLightVersion((v) => v + 1)
        } else {
          setHasHeroBackgroundLight(true)
          setHeroBackgroundLightVersion((v) => v + 1)
        }
      } else {
        if (scope === "affiliate") {
          setHasAffiliateHeroBackgroundDark(true)
          setAffiliateHeroBackgroundDarkVersion((v) => v + 1)
        } else {
          setHasHeroBackgroundDark(true)
          setHeroBackgroundDarkVersion((v) => v + 1)
        }
      }
      toast.success(
        `${scope === "affiliate" ? "Фон hero (/affiliate)" : "Фон hero"} ${
          theme === "light" ? "для светлой темы обновлён" : "для тёмной темы обновлён"
        }`,
      )
    } catch {
      notifyMutationError("Не удалось загрузить фон для hero")
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
        notifyMutationError("Не удалось удалить фон для hero")
        return
      }

      rememberBackgroundKey("hero", null, null, null)
      setHasHeroBackground(false)
      setHeroBackgroundVersion((v) => v + 1)
      toast.success("Фон hero сброшен")
    } catch {
      notifyMutationError("Не удалось удалить фон для hero")
    } finally {
      setDeletingHeroBackground(false)
    }
  }

  const handleDeleteHeroBackgroundWithTheme = async (
    theme: "light" | "dark",
    scope: "landing" | "affiliate" = "landing",
  ) => {
    const setDeletingFn =
      scope === "affiliate"
        ? theme === "light"
          ? setDeletingAffiliateHeroBackgroundLight
          : setDeletingAffiliateHeroBackgroundDark
        : theme === "light"
          ? setDeletingHeroBackgroundLight
          : setDeletingHeroBackgroundDark

    setDeletingFn(true)
    try {
      const token = getToken()
      const scopeQuery = scope === "affiliate" ? "&scope=affiliate" : ""
      const res = await fetch(`/api/site/backgrounds/hero?theme=${theme}${scopeQuery}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        notifyMutationError("Не удалось удалить фон для hero")
        return
      }

      rememberBackgroundKey("hero", theme, scope === "affiliate" ? "affiliate" : null, null)
      if (theme === "light") {
        if (scope === "affiliate") {
          setHasAffiliateHeroBackgroundLight(false)
          setAffiliateHeroBackgroundLightVersion((v) => v + 1)
        } else {
          setHasHeroBackgroundLight(false)
          setHeroBackgroundLightVersion((v) => v + 1)
        }
      } else {
        if (scope === "affiliate") {
          setHasAffiliateHeroBackgroundDark(false)
          setAffiliateHeroBackgroundDarkVersion((v) => v + 1)
        } else {
          setHasHeroBackgroundDark(false)
          setHeroBackgroundDarkVersion((v) => v + 1)
        }
      }
      toast.success(
        `${scope === "affiliate" ? "Фон hero (/affiliate)" : "Фон hero"} ${
          theme === "light" ? "для светлой темы сброшен" : "для тёмной темы сброшен"
        }`,
      )
    } catch {
      notifyMutationError("Не удалось удалить фон для hero")
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

      const json = (await res.json().catch(() => null)) as { error?: string; key?: string } | null
      if (!res.ok) {
        notifyMutationError(json?.error ?? "Не удалось загрузить общий фон")
        return
      }

      rememberBackgroundKey("global", null, null, json?.key)
      setHasGlobalBackground(true)
      setGlobalBackgroundVersion((v) => v + 1)
      toast.success("Общий фон обновлён")
    } catch {
      notifyMutationError("Не удалось загрузить общий фон")
    } finally {
      setUploadingGlobalBackground(false)
    }
  }

  const handleUploadGlobalBackgroundWithTheme = async (
    file: File,
    theme: "light" | "dark",
    scope: "landing" | "affiliate" = "landing",
  ) => {
    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast.error("Файл не должен превышать 5 МБ")
      return
    }

    const setUploadingFn =
      scope === "affiliate"
        ? theme === "light"
          ? setUploadingAffiliateGlobalBackgroundLight
          : setUploadingAffiliateGlobalBackgroundDark
        : theme === "light"
          ? setUploadingGlobalBackgroundLight
          : setUploadingGlobalBackgroundDark

    setUploadingFn(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const scopeQuery = scope === "affiliate" ? "&scope=affiliate" : ""
      const res = await fetch(`/api/site/backgrounds/global?theme=${theme}${scopeQuery}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })

      const json = (await res.json().catch(() => null)) as { error?: string; key?: string } | null
      if (!res.ok) {
        notifyMutationError(json?.error ?? "Не удалось загрузить общий фон")
        return
      }

      rememberBackgroundKey("global", theme, scope === "affiliate" ? "affiliate" : null, json?.key)
      if (theme === "light") {
        if (scope === "affiliate") {
          setHasAffiliateGlobalBackgroundLight(true)
          setAffiliateGlobalBackgroundLightVersion((v) => v + 1)
        } else {
          setHasGlobalBackgroundLight(true)
          setGlobalBackgroundLightVersion((v) => v + 1)
        }
      } else {
        if (scope === "affiliate") {
          setHasAffiliateGlobalBackgroundDark(true)
          setAffiliateGlobalBackgroundDarkVersion((v) => v + 1)
        } else {
          setHasGlobalBackgroundDark(true)
          setGlobalBackgroundDarkVersion((v) => v + 1)
        }
      }
      toast.success(
        `${scope === "affiliate" ? "Общий фон (/affiliate)" : "Общий фон"} ${
          theme === "light" ? "для светлой темы обновлён" : "для тёмной темы обновлён"
        }`,
      )
    } catch {
      notifyMutationError("Не удалось загрузить общий фон")
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
        notifyMutationError("Не удалось удалить общий фон")
        return
      }

      rememberBackgroundKey("global", null, null, null)
      setHasGlobalBackground(false)
      setGlobalBackgroundVersion((v) => v + 1)
      toast.success("Общий фон сброшен")
    } catch {
      notifyMutationError("Не удалось удалить общий фон")
    } finally {
      setDeletingGlobalBackground(false)
    }
  }

  const handleDeleteGlobalBackgroundWithTheme = async (
    theme: "light" | "dark",
    scope: "landing" | "affiliate" = "landing",
  ) => {
    const setDeletingFn =
      scope === "affiliate"
        ? theme === "light"
          ? setDeletingAffiliateGlobalBackgroundLight
          : setDeletingAffiliateGlobalBackgroundDark
        : theme === "light"
          ? setDeletingGlobalBackgroundLight
          : setDeletingGlobalBackgroundDark

    setDeletingFn(true)
    try {
      const token = getToken()
      const scopeQuery = scope === "affiliate" ? "&scope=affiliate" : ""
      const res = await fetch(`/api/site/backgrounds/global?theme=${theme}${scopeQuery}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!res.ok) {
        notifyMutationError("Не удалось удалить общий фон")
        return
      }

      rememberBackgroundKey("global", theme, scope === "affiliate" ? "affiliate" : null, null)
      if (theme === "light") {
        if (scope === "affiliate") {
          setHasAffiliateGlobalBackgroundLight(false)
          setAffiliateGlobalBackgroundLightVersion((v) => v + 1)
        } else {
          setHasGlobalBackgroundLight(false)
          setGlobalBackgroundLightVersion((v) => v + 1)
        }
      } else {
        if (scope === "affiliate") {
          setHasAffiliateGlobalBackgroundDark(false)
          setAffiliateGlobalBackgroundDarkVersion((v) => v + 1)
        } else {
          setHasGlobalBackgroundDark(false)
          setGlobalBackgroundDarkVersion((v) => v + 1)
        }
      }
      toast.success(
        `${scope === "affiliate" ? "Общий фон (/affiliate)" : "Общий фон"} ${
          theme === "light" ? "для светлой темы сброшен" : "для тёмной темы сброшен"
        }`,
      )
    } catch {
      notifyMutationError("Не удалось удалить общий фон")
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
        notifyMutationError("Не удалось удалить фавикон")
        return
      }

      setFaviconKey(null)
      setHasFavicon(false)
      const nextVersion = Date.now()
      setFaviconVersion(nextVersion)
      syncDocumentFavicon(nextVersion, null)
      toast.success("Фавикон сброшен до значения по умолчанию")
    } catch {
      notifyMutationError("Не удалось удалить фавикон")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Настройки сайта</h2>
      <Card>
        <CardHeader>
          <CardTitle>Логотип</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Текущий логотип</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted border border-border">
                <img
                  key={logoVersion}
                  src={getSiteLogoSrc(logoKey, { cacheBust: logoVersion })}
                  alt="Logo preview"
                  className="h-full w-full object-cover"
                  onLoad={() => setHasLogo(true)}
                  onError={() => setHasLogo(false)}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {hasLogo ? "Кастомный логотип загружен" : "Используется логотип по умолчанию"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Загружается PNG/JPG/WebP до 5 МБ. Используется в `Header` и `Footer`.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo_text">Текст рядом с логотипом</Label>
            <Input
              id="logo_text"
              type="text"
              value={logoText}
              onChange={(e) => setLogoText(e.target.value)}
              placeholder="Например: Rythm Group"
            />
            <p className="text-xs text-muted-foreground">
              Если оставить пустым, текст рядом с логотипом в `Header` и `Footer` не отображается.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Загрузить новый логотип</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadLogo(file)
                  e.target.value = ""
                }
              }}
              disabled={uploadingLogo}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!initialSettings) return
                setLogoText(initialSettings.logoText)
              }}
              disabled={!initialSettings || loadingSettings || savingSettings}
            >
              Отменить текст
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!hasLogo || deletingLogo}
              onClick={() => {
                void handleDeleteLogo()
              }}
            >
              Сбросить до дефолтного
            </Button>
          </div>
        </CardContent>
      </Card>
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
                    src={getSiteFaviconSrc(faviconKey, { cacheBust: faviconVersion })}
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
              удалить кастомный фавикон, вернётся значение по умолчанию (<code>/logo.jpg</code>).
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
                    src={bgPreview("hero", "light", null, heroBackgroundLightVersion)}
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
                    src={bgPreview("hero", "dark", null, heroBackgroundDarkVersion)}
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
                    src={bgPreview("global", "light", null, globalBackgroundLightVersion)}
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
                    src={bgPreview("global", "dark", null, globalBackgroundDarkVersion)}
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
          <CardTitle>Фоны страницы /affiliate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xs text-muted-foreground">
            Отдельные фоновые изображения для страницы Affiliate. Если не загружены, используется визуальный фон по умолчанию.
          </p>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Hero /affiliate для светлой темы (16:9)</Label>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasAffiliateHeroBackgroundLight ? (
                  <img
                    key={affiliateHeroBackgroundLightVersion}
                    src={bgPreview("hero", "light", "affiliate", affiliateHeroBackgroundLightVersion)}
                    alt="Affiliate hero background preview (light theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasAffiliateHeroBackgroundLight(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">Не загружен</span>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadHeroBackgroundWithTheme(file, "light", "affiliate")
                  e.target.value = ""
                }
              }}
              disabled={uploadingAffiliateHeroBackgroundLight}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasAffiliateHeroBackgroundLight || deletingAffiliateHeroBackgroundLight}
                onClick={() => {
                  void handleDeleteHeroBackgroundWithTheme("light", "affiliate")
                }}
              >
                Сбросить Hero /affiliate (светлая тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Hero /affiliate для тёмной темы (16:9)</Label>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasAffiliateHeroBackgroundDark ? (
                  <img
                    key={affiliateHeroBackgroundDarkVersion}
                    src={bgPreview("hero", "dark", "affiliate", affiliateHeroBackgroundDarkVersion)}
                    alt="Affiliate hero background preview (dark theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasAffiliateHeroBackgroundDark(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">Не загружен</span>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadHeroBackgroundWithTheme(file, "dark", "affiliate")
                  e.target.value = ""
                }
              }}
              disabled={uploadingAffiliateHeroBackgroundDark}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasAffiliateHeroBackgroundDark || deletingAffiliateHeroBackgroundDark}
                onClick={() => {
                  void handleDeleteHeroBackgroundWithTheme("dark", "affiliate")
                }}
              >
                Сбросить Hero /affiliate (тёмная тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Общий фон /affiliate для светлой темы (9:16)</Label>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasAffiliateGlobalBackgroundLight ? (
                  <img
                    key={affiliateGlobalBackgroundLightVersion}
                    src={bgPreview("global", "light", "affiliate", affiliateGlobalBackgroundLightVersion)}
                    alt="Affiliate global background preview (light theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasAffiliateGlobalBackgroundLight(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">Не загружен</span>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadGlobalBackgroundWithTheme(file, "light", "affiliate")
                  e.target.value = ""
                }
              }}
              disabled={uploadingAffiliateGlobalBackgroundLight}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasAffiliateGlobalBackgroundLight || deletingAffiliateGlobalBackgroundLight}
                onClick={() => {
                  void handleDeleteGlobalBackgroundWithTheme("light", "affiliate")
                }}
              >
                Сбросить общий фон /affiliate (светлая тема)
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <Label>Общий фон /affiliate для тёмной темы (9:16)</Label>
              </div>
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded border border-border bg-muted">
                {hasAffiliateGlobalBackgroundDark ? (
                  <img
                    key={affiliateGlobalBackgroundDarkVersion}
                    src={bgPreview("global", "dark", "affiliate", affiliateGlobalBackgroundDarkVersion)}
                    alt="Affiliate global background preview (dark theme)"
                    className="h-full w-full object-cover"
                    onError={() => setHasAffiliateGlobalBackgroundDark(false)}
                  />
                ) : (
                  <span className="px-2 text-center text-[10px] text-muted-foreground">Не загружен</span>
                )}
              </div>
            </div>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void handleUploadGlobalBackgroundWithTheme(file, "dark", "affiliate")
                  e.target.value = ""
                }
              }}
              disabled={uploadingAffiliateGlobalBackgroundDark}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasAffiliateGlobalBackgroundDark || deletingAffiliateGlobalBackgroundDark}
                onClick={() => {
                  void handleDeleteGlobalBackgroundWithTheme("dark", "affiliate")
                }}
              >
                Сбросить общий фон /affiliate (тёмная тема)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Отображение партнёров (кейсы)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="partners_display_mode">Режим отображения</Label>
            <select
              id="partners_display_mode"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={partnersDisplayMode}
              onChange={(e) =>
                setPartnersDisplayMode(e.target.value as "name" | "logo" | "logoAndName")
              }
            >
              <option value="name">Только название</option>
              <option value="logo">Только эмблема</option>
              <option value="logoAndName">Эмблема и название снизу</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Определяет, как партнёры будут отображаться на лендинге в блоке кейсов.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Отображение каналов</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channels_card_align">Выравнивание в карточке</Label>
            <select
              id="channels_card_align"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={channelsCardAlign}
              onChange={(e) => {
                const value = e.target.value
                setChannelsCardAlign(
                  value === "center" || value === "right" ? value : "left",
                )
              }}
            >
              <option value="left">Слева</option>
              <option value="center">По центру</option>
              <option value="right">Справа</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="channels_show_subscribers">Показывать подписчиков</Label>
              <p className="text-xs text-muted-foreground">
                Если выключено, число подписчиков не отображается на карточках.
              </p>
            </div>
            <Switch
              id="channels_show_subscribers"
              checked={channelsShowSubscribers}
              onCheckedChange={setChannelsShowSubscribers}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="channels_show_reach">Показывать охват</Label>
              <p className="text-xs text-muted-foreground">
                Если выключено, охват не отображается на карточках.
              </p>
            </div>
            <Switch
              id="channels_show_reach"
              checked={channelsShowReach}
              onCheckedChange={setChannelsShowReach}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Контакты</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_layout">Порядок блоков</Label>
            <select
              id="contact_layout"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={contactLayout}
              onChange={(e) =>
                setContactLayout(e.target.value === "contactsFirst" ? "contactsFirst" : "formFirst")
              }
            >
              <option value="formFirst">Сначала форма, затем соцсети</option>
              <option value="contactsFirst">Сначала соцсети, затем форма</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="contact_form_hidden">Скрыть форму заявки</Label>
              <p className="text-xs text-muted-foreground">
                Если включено, на лендинге будут отображаться только ссылки на Telegram и другие соцсети.
              </p>
            </div>
            <Switch
              id="contact_form_hidden"
              checked={contactFormHidden}
              onCheckedChange={setContactFormHidden}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Контакты (Affiliate)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="affiliate_contact_layout">Порядок блоков</Label>
            <select
              id="affiliate_contact_layout"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              value={affiliateContactLayout}
              onChange={(e) =>
                setAffiliateContactLayout(e.target.value === "contactsFirst" ? "contactsFirst" : "formFirst")
              }
            >
              <option value="formFirst">Сначала форма, затем соцсети</option>
              <option value="contactsFirst">Сначала соцсети, затем форма</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="affiliate_contact_form_hidden">Скрыть форму заявки</Label>
              <p className="text-xs text-muted-foreground">
                Если включено, на странице Affiliate будут отображаться только ссылки на Telegram и другие соцсети.
              </p>
            </div>
            <Switch
              id="affiliate_contact_form_hidden"
              checked={affiliateContactFormHidden}
              onCheckedChange={setAffiliateContactFormHidden}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Блог и Affiliate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="blog_show_dates">Показывать даты в блоге</Label>
              <p className="text-xs text-muted-foreground">
                Даты на карточках и на странице записи на публичном сайте.
              </p>
            </div>
            <Switch id="blog_show_dates" checked={blogShowDates} onCheckedChange={setBlogShowDates} />
          </div>
          {/* <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="affiliate_blog_block">Мини-блог на странице /affiliate</Label>
              <p className="text-xs text-muted-foreground">
                До 6 последних опубликованных записей (когда страница будет подключена).
              </p>
            </div>
            <Switch
              id="affiliate_blog_block"
              checked={affiliateShowBlogBlock}
              onCheckedChange={setAffiliateShowBlogBlock}
            />
          </div> */}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Порядок кнопок в шапке</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Перетащите пункты для изменения порядка кнопок разделов в `Header`.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleHeaderNavDragEnd}
          >
            <SortableNavList items={headerNavOrder}>
              <ul className="space-y-2">
                {headerNavOrder.map((id) => (
                  <SortableNavItem
                    key={id}
                    id={id}
                    labelRu={headerNavLabels[id].ru}
                    labelEn={headerNavLabels[id].en}
                  />
                ))}
              </ul>
            </SortableNavList>
          </DndContext>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Видимость страниц</CardTitle>
          <CardDescription>Главная страница (/) всегда доступна и не может быть отключена.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="site_published">Сайт опубликован</Label>
              <p className="text-xs text-muted-foreground">
                {sitePublished ? "Сайт доступен для посетителей." : "Сайт в режиме обслуживания — публичные страницы недоступны."}
              </p>
            </div>
            <Switch
              id="site_published"
              checked={sitePublished}
              onCheckedChange={setSitePublished}
            />
          </div>
          <div className="border-t border-border/60 pt-4" />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="page_blog_enabled">Страница /blog</Label>
              <p className="text-xs text-muted-foreground">
                При отключении страница вернёт 404 и исчезнет из навигации.
              </p>
            </div>
            <Switch
              id="page_blog_enabled"
              checked={pageBlogEnabled}
              onCheckedChange={setPageBlogEnabled}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="page_affiliate_enabled">Страница /wishlists</Label>
              <p className="text-xs text-muted-foreground">
                При отключении страница вернёт 404 и исчезнет из навигации.
              </p>
            </div>
            <Switch
              id="page_affiliate_enabled"
              checked={pageAffiliateEnabled}
              onCheckedChange={setPageAffiliateEnabled}
            />
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
                setLogoText(initialSettings.logoText)
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

