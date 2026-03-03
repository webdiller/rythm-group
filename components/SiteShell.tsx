"use client"

import { useEffect, useState, type ReactNode } from "react"

type SiteShellProps = {
  children: ReactNode
  hasAnyCustomBackgrounds: boolean
}

export function SiteShell({ children, hasAnyCustomBackgrounds }: SiteShellProps) {
  const [ready, setReady] = useState(!hasAnyCustomBackgrounds)

  useEffect(() => {
    if (!hasAnyCustomBackgrounds) return

    const sources = [
      "/api/site/backgrounds/global?theme=light",
      "/api/site/backgrounds/global?theme=dark",
      "/api/site/backgrounds/hero?theme=light",
      "/api/site/backgrounds/hero?theme=dark",
    ]

    let completed = 0
    const onDone = () => {
      completed += 1
      if (completed >= sources.length) {
        setReady(true)
      }
    }

    const images = sources.map((src) => {
      const img = new Image()
      img.onload = onDone
      img.onerror = onDone
      img.src = src
      return img
    })

    return () => {
      images.forEach((img) => {
        img.onload = null
        img.onerror = null
      })
    }
  }, [hasAnyCustomBackgrounds])

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

