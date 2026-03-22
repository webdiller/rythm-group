"use client"

import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

/** Сегмент: у всех кроме последнего задаётся `href`; последний без `href` — текущая страница. */
export type AppBreadcrumbSegment = {
  label: string
  href?: string
}

export type AppBreadcrumbsProps = {
  items: AppBreadcrumbSegment[]
  /** className для `BreadcrumbList` */
  className?: string
  /** className для обёртки `<nav>` */
  navClassName?: string
  /** Доп. классы для последнего сегмента (текущая страница) */
  currentPageClassName?: string
  "aria-label"?: string
}

const DEFAULT_NAV_CLASS = "mb-6 lg:mb-8"

export function AppBreadcrumbs({
  items,
  className,
  navClassName,
  currentPageClassName,
  "aria-label": ariaLabel = "breadcrumb",
}: AppBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <Breadcrumb aria-label={ariaLabel} className={cn(DEFAULT_NAV_CLASS, navClassName)}>
      <BreadcrumbList className={className}>
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <Fragment key={`${i}-${item.label}`}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage
                    className={cn("max-w-48 truncate sm:max-w-none", currentPageClassName)}
                  >
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href!}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
