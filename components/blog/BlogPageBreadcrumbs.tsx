"use client"

import { useLocale } from "@/lib/locale-context"
import type { BlogCategory } from "@/lib/blog/types"
import { AppBreadcrumbs } from "@/components/AppBreadcrumbs"

type BlogPageBreadcrumbsProps = { variant: "index" } | { variant: "category"; category: BlogCategory } | { variant: "post"; category: BlogCategory; postTitle: string }

export function BlogPageBreadcrumbs(props: BlogPageBreadcrumbsProps) {
  const { locale, t } = useLocale()
  const homeLabel = t.blog.breadcrumbHome
  const blogLabel = t.blog.title

  if (props.variant === "index") {
    return <AppBreadcrumbs items={[{ label: homeLabel, href: "/" }, { label: blogLabel }]} />
  }

  if (props.variant === "category") {
    const catLabel = locale === "en" ? props.category.name_en : props.category.name_ru
    return <AppBreadcrumbs items={[{ label: homeLabel, href: "/" }, { label: blogLabel, href: "/blog" }, { label: catLabel }]} />
  }

  const catLabel = locale === "en" ? props.category.name_en : props.category.name_ru
  return <AppBreadcrumbs items={[{ label: homeLabel, href: "/" }, { label: blogLabel, href: "/blog" }, { label: catLabel, href: `/blog/${props.category.slug}` }, { label: props.postTitle }]} />
}
