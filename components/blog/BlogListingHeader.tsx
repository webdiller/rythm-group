"use client"

import { useLocale } from "@/lib/locale-context"
import type { BlogCategory } from "@/lib/blog/types"
import { BlogPageBreadcrumbs } from "@/components/blog/BlogPageBreadcrumbs"
import { StaggerItem } from "@/components/ui/stagger-item"
import { useEffect, useState } from "react"

type BlogListingHeaderProps = {
  category?: BlogCategory | null
}

export function BlogListingHeader({ category }: BlogListingHeaderProps) {
  const { locale, t } = useLocale()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    try {
      const marker = window.sessionStorage.getItem("blog-listing-header-animate-next")
      if (marker === "1") {
        setShouldAnimate(true)
        window.sessionStorage.removeItem("blog-listing-header-animate-next")
        return
      }
    } catch {
      // ignore storage failures
    }
    setShouldAnimate(false)
  }, [])

  if (category) {
    const title = locale === "en" ? category.name_en : category.name_ru
    return (
      <header id="top" className="mb-8 space-y-4 lg:mb-10 lg:space-y-5">
        <StaggerItem
          index={0}
          delayStart={120}
          delayStep={60}
          durationClassName="duration-700"
          disabled={!shouldAnimate}
        >
          <BlogPageBreadcrumbs variant="category" category={category} />
        </StaggerItem>
        <StaggerItem
          index={1}
          delayStart={120}
          delayStep={60}
          disabled={!shouldAnimate}
          hiddenClassName="translate-y-4 opacity-0"
          visibleClassName="translate-y-0 opacity-100"
          durationClassName="duration-700"
        >
          <div className="space-y-3">
            <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {title}
            </h1>
          </div>
        </StaggerItem>
      </header>
    )
  }

  return (
    <header id="top" className="mb-8 space-y-4 lg:mb-10 lg:space-y-5">
      <StaggerItem
        index={0}
        delayStart={120}
        delayStep={60}
        durationClassName="duration-700"
        disabled={!shouldAnimate}
      >
        <BlogPageBreadcrumbs variant="index" />
      </StaggerItem>
      <StaggerItem
        index={1}
        delayStart={120}
        delayStep={60}
        disabled={!shouldAnimate}
        hiddenClassName="translate-y-4 opacity-0"
        visibleClassName="translate-y-0 opacity-100"
        durationClassName="duration-700"
      >
        <div className="space-y-3">
          <h1 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {t.blog.title}
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">{t.blog.subtitle}</p>
        </div>
      </StaggerItem>
    </header>
  )
}
