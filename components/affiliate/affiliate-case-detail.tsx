"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import type { AffiliateCaseDetailUi } from "@/lib/affiliate/cases-ui"
import { WISHLISTS_BASE_PATH } from "@/lib/wishlists-path"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs"
import { Eye, Heart, CalendarDays, Tag, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"

type AffiliateCaseDetailProps = {
  caseItem: AffiliateCaseDetailUi
}

export function AffiliateCaseDetail({ caseItem: c }: AffiliateCaseDetailProps) {
  const { locale, t } = useLocale()
  const cp = t.affiliate.casePage
  const [views, setViews] = useState(c.views)
  const [activeGalleryId, setActiveGalleryId] = useState(c.gallery[0]?.id ?? null)
  const title = locale === "en" ? c.title_en : c.title_ru
  const desc = locale === "en" ? c.shortDescription_en : c.shortDescription_ru
  const category = locale === "en" ? c.category_en : c.category_ru
  const dateLocale = locale === "en" ? enUS : ru
  const parsedDate = c.publishedAt ? new Date(c.publishedAt) : null
  const formattedDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? format(parsedDate, "d MMM yyyy", { locale: dateLocale })
      : locale === "en"
        ? "No date"
        : "Без даты"
  const coverSrc = c.coverImage?.trim() || ""
  const showAvatar = Boolean(c.showLogoOnCaseDetail && coverSrc)
  const gallery = c.gallery
  const activeImage = gallery.find((item) => item.id === activeGalleryId) ?? gallery[0] ?? null
  const showWishlists = c.showWishlists
  const showViews = c.showViews

  useEffect(() => {
    setActiveGalleryId(c.gallery[0]?.id ?? null)
  }, [c.gallery])

  useEffect(() => {
    if (!showViews) return
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(`/api/content/partners/${c.id}/views`, { method: "POST" })
        if (!res.ok) return
        const json = (await res.json()) as { data?: { views?: number } }
        if (!cancelled && typeof json.data?.views === "number") {
          setViews(json.data.views)
        }
      } catch {
        // ignore analytics errors on UI side
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [c.id, showViews])

  return (
    <article className="space-y-12 pb-16">
      <AppBreadcrumbs
        items={[
          { label: locale === "en" ? "Home" : "Главная", href: "/" },
          { label: locale === "en" ? "Wishlists" : "Вишлисты", href: WISHLISTS_BASE_PATH },
          { label: title },
        ]}
      />

      <Link
        href={WISHLISTS_BASE_PATH}
        className="inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {cp.back}
      </Link>

      <header className="space-y-6">
        {activeImage ? (
          <div className="space-y-3">
            <div className="relative flex max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted">
              <img
                key={`${activeImage.id}-blur`}
                src={activeImage.originalSrc}
                alt=""
                aria-hidden
                width={activeImage.width}
                height={activeImage.height}
                className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-md"
                loading="eager"
                decoding="async"
              />
              <img
                key={activeImage.id}
                src={activeImage.originalSrc}
                alt=""
                width={activeImage.width}
                height={activeImage.height}
                className="relative z-10 mx-auto max-h-[70vh] w-full object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((image) => {
                  const isActive = image.id === activeImage.id
                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setActiveGalleryId(image.id)}
                      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-colors ${
                        isActive
                          ? "border-primary ring-2 ring-primary/40"
                          : "border-border/70 hover:border-primary/40"
                      }`}
                      aria-label={locale === "en" ? "Show image" : "Показать изображение"}
                      aria-pressed={isActive}
                    >
                      <img
                        src={image.thumbnailSrc}
                        alt=""
                        width={image.thumbnailWidth}
                        height={image.thumbnailHeight}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-4">
          {showAvatar ? (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted sm:h-16 sm:w-16">
              <img
                src={coverSrc}
                alt=""
                className="h-full w-full object-contain p-1"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : null}
          <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h1>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/80 bg-card/85 py-0 shadow-none backdrop-blur-sm">
          <CardHeader className="px-6 pt-6 pb-3 md:px-8 md:pt-8 md:pb-4">
            <CardTitle className="text-xl">{cp.aboutGame}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6 pt-0 text-sm text-muted-foreground md:px-8 md:pb-8">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                  <Tag className="h-3.5 w-3.5" />
                  {locale === "en" ? "Category" : "Категория"}
                </p>
                <p className="text-foreground">{category}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="mb-1 inline-flex items-center gap-2 text-xs uppercase tracking-wide">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t.affiliate.cases.publishedLabel}
                </p>
                <p className="text-foreground">{formattedDate}</p>
              </div>
            </div>
            <p className="max-w-3xl text-base leading-relaxed">{desc}</p>
            {c.steamGameUrl ? (
              <a
                href={c.steamGameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-primary"
              >
                {cp.openInSteam}
                <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
              </a>
            ) : null}
          </CardContent>
        </Card>

        {showWishlists || showViews ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {showWishlists ? (
              <Card className="border-border/80 bg-card/85 py-0 shadow-none">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t.affiliate.cases.wishlistsLabel}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(c.wishlists)}
                    </p>
                  </div>
                  <Heart className="h-6 w-6 text-primary" />
                </CardContent>
              </Card>
            ) : null}
            {showViews ? (
              <Card className="border-border/80 bg-card/85 py-0 shadow-none">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{cp.views}</p>
                    <p className="text-2xl font-bold text-foreground">
                      {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(views)}
                    </p>
                  </div>
                  <Eye className="h-6 w-6 text-primary" />
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}
      </section>
    </article>
  )
}
