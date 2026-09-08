"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import PhotoSwipeLightbox from "photoswipe/lightbox"
import "photoswipe/style.css"
import { useLocale } from "@/lib/locale-context"
import type {
  AffiliateCaseChannelUi,
  AffiliateCaseDetailUi,
  AffiliateCaseGalleryImageUi,
} from "@/lib/affiliate/cases-ui"
import { WISHLISTS_BASE_PATH } from "@/lib/wishlists-path"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Eye, Heart, CalendarDays, Tag, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { cn } from "@/lib/utils"

function CaseChannelMiniCard({ channel }: { channel: AffiliateCaseChannelUi }) {
  const [hasImage, setHasImage] = useState(Boolean(channel.avatarSrc))

  return (
    <Link
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/30"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
        {hasImage && channel.avatarSrc ? (
          <img
            src={channel.avatarSrc}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setHasImage(false)}
          />
        ) : (
          <span className="text-lg font-bold">{channel.name.charAt(0)}</span>
        )}
      </div>
      <h3 className="min-w-0 truncate text-sm font-semibold text-card-foreground sm:text-base">
        {channel.name}
      </h3>
    </Link>
  )
}

type AffiliateCaseDetailProps = {
  caseItem: AffiliateCaseDetailUi
}

function GallerySlide({
  image,
  priority,
  onOpen,
  openLabel,
}: {
  image: AffiliateCaseGalleryImageUi
  priority?: boolean
  onOpen: () => void
  openLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={openLabel}
      className="relative flex h-[280px] w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-muted sm:h-[360px] lg:h-[420px]"
    >
      <img
        src={image.originalSrc}
        alt=""
        aria-hidden
        width={image.width}
        height={image.height}
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-md"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <img
        src={image.originalSrc}
        alt=""
        width={image.width}
        height={image.height}
        className="relative z-10 h-full w-full object-contain"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    </button>
  )
}

function CaseGallery({
  gallery,
  locale,
}: {
  gallery: AffiliateCaseGalleryImageUi[]
  locale: "en" | "ru"
}) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const lightboxRef = useRef<PhotoSwipeLightbox | null>(null)
  const thumbsRef = useRef<HTMLDivElement | null>(null)
  const thumbButtonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openLabel = locale === "en" ? "Open image" : "Открыть изображение"

  const onSelect = useCallback((carouselApi: CarouselApi) => {
    if (!carouselApi) return
    setSelectedIndex(carouselApi.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!api) return
    onSelect(api)
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    setSelectedIndex(0)
    api?.scrollTo(0, true)
  }, [gallery, api])

  useEffect(() => {
    const container = thumbsRef.current
    const activeThumb = thumbButtonRefs.current[selectedIndex]
    if (!container || !activeThumb) return
    const targetLeft =
      activeThumb.offsetLeft - (container.clientWidth - activeThumb.offsetWidth) / 2
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" })
  }, [selectedIndex])

  useEffect(() => {
    if (gallery.length === 0) return

    const lightbox = new PhotoSwipeLightbox({
      dataSource: gallery.map((image) => ({
        src: image.originalSrc,
        width: image.width,
        height: image.height,
        msrc: image.thumbnailSrc,
      })),
      // Dynamic import — PhotoSwipe core loads on first open
      // https://photoswipe.com/react-image-gallery/
      pswpModule: () => import("photoswipe"),
    })
    lightbox.init()
    lightboxRef.current = lightbox

    return () => {
      lightbox.destroy()
      lightboxRef.current = null
    }
  }, [gallery])

  const openLightbox = useCallback((index: number) => {
    lightboxRef.current?.loadAndOpen(index)
  }, [])

  if (gallery.length === 0) return null

  if (gallery.length === 1) {
    return (
      <div className="w-full">
        <GallerySlide
          image={gallery[0]!}
          priority
          onOpen={() => openLightbox(0)}
          openLabel={openLabel}
        />
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {gallery.map((image, index) => (
            <CarouselItem key={image.id} className="pl-0">
              <GallerySlide
                image={image}
                priority={index === 0}
                onOpen={() => openLightbox(index)}
                openLabel={openLabel}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          variant="secondary"
          className="left-1 z-20 size-9 border-border/80 bg-background/85 shadow-sm backdrop-blur-sm hover:bg-background disabled:opacity-40 sm:left-2"
        />
        <CarouselNext
          variant="secondary"
          className="right-1 z-20 size-9 border-border/80 bg-background/85 shadow-sm backdrop-blur-sm hover:bg-background disabled:opacity-40 sm:right-2"
        />
      </Carousel>

      <div
        ref={thumbsRef}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {gallery.map((image, index) => {
          const isActive = index === selectedIndex
          return (
            <button
              key={image.id}
              ref={(node) => {
                thumbButtonRefs.current[index] = node
              }}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition-[border-color,box-shadow,opacity]",
                isActive
                  ? "border-primary ring-2 ring-primary/35"
                  : "border-border/70 opacity-80 hover:border-primary/40 hover:opacity-100",
              )}
              aria-label={
                locale === "en"
                  ? `Show image ${index + 1}`
                  : `Показать изображение ${index + 1}`
              }
              aria-current={isActive ? "true" : undefined}
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
    </div>
  )
}

export function AffiliateCaseDetail({ caseItem: c }: AffiliateCaseDetailProps) {
  const { locale, t } = useLocale()
  const cp = t.affiliate.casePage
  const [views, setViews] = useState(c.views)
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
  const showWishlists = c.showWishlists
  const showViews = c.showViews
  const hasGallery = gallery.length > 0

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
    <article className="space-y-8 pb-16 sm:space-y-10">
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

      <div
        className={cn(
          "grid gap-8 lg:gap-10 lg:items-start",
          hasGallery && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
        )}
      >
        {hasGallery ? (
          <div className="min-w-0 lg:sticky lg:top-24">
            <CaseGallery gallery={gallery} locale={locale} />
          </div>
        ) : null}

        <div className="min-w-0 space-y-6">
          <header className="flex items-center gap-4">
            {showAvatar ? (
              <div className="size-14 shrink-0 flex items-center sm:size-16">
                <img
                  src={coverSrc}
                  alt=""
                  className="object-contain h-auto w-full rounded-xl"
                  loading="eager"
                  decoding="async"
                />
              </div>
            ) : null}
            <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
          </header>

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
              <p className="text-base leading-relaxed text-muted-foreground">{desc}</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              {showWishlists ? (
                <Card className="border-border/80 bg-card/85 py-0 shadow-none">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t.affiliate.cases.wishlistsLabel}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(
                          c.wishlists,
                        )}
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
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {cp.views}
                      </p>
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

          {c.channels.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">{cp.publishedInChannels}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {c.channels.map((channel) => (
                  <CaseChannelMiniCard key={channel.id} channel={channel} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  )
}
