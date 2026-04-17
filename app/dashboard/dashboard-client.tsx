"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout, type DashboardTabId } from "@/components/dashboard/DashboardLayout"
import { TranslationsEditor } from "@/components/dashboard/TranslationsEditor"
import { ChannelsEditor } from "@/components/dashboard/ChannelsEditor"
import { PartnersEditor } from "@/components/dashboard/PartnersEditor"
import { ContactsEditor } from "@/components/dashboard/ContactsEditor"
import { SiteSettingsEditor } from "@/components/dashboard/SiteSettingsEditor"
import { BlogEditor } from "@/components/dashboard/BlogEditor"
import { AffiliateHeroEditor } from "@/components/dashboard/AffiliateHeroEditor"
import { AffiliateFormatsEditor } from "@/components/dashboard/AffiliateFormatsEditor"
import { AffiliateFaqEditor } from "@/components/dashboard/AffiliateFaqEditor"
import { AffiliateSectionsEditor } from "@/components/dashboard/AffiliateSectionsEditor"
import { AboutCardsEditor } from "@/components/dashboard/AboutCardsEditor"

const VALID_TABS = new Set<DashboardTabId>([
  "translations",
  "channels",
  "partners",
  "about-cards",
  "blog",
  "contacts",
  "settings",
  "affiliate-sections",
  "affiliate-hero",
  "affiliate-formats",
  "affiliate-faq",
])

function isDashboardTabId(value: string): value is DashboardTabId {
  return VALID_TABS.has(value as DashboardTabId)
}

function DashboardInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTabId>("translations")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && isDashboardTabId(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]
      if (!token) {
        router.push("/dashboard/login")
        return
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid) {
          setIsAuthenticated(true)
        } else {
          router.push("/dashboard/login")
        }
      } else {
        router.push("/dashboard/login")
      }
    } catch (error) {
      router.push("/dashboard/login")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const renderContent = () => {
    switch (activeTab) {
      case "translations":
        return <TranslationsEditor />
      case "channels":
        return <ChannelsEditor />
      case "partners":
        return <PartnersEditor />
      case "about-cards":
        return <AboutCardsEditor />
      case "blog":
        return <BlogEditor />
      case "contacts":
        return <ContactsEditor />
      case "settings":
        return <SiteSettingsEditor />
      case "affiliate-sections":
        return <AffiliateSectionsEditor />
      case "affiliate-hero":
        return <AffiliateHeroEditor />
      case "affiliate-formats":
        return <AffiliateFormatsEditor />
      case "affiliate-faq":
        return <AffiliateFaqEditor />
      default:
        return <TranslationsEditor />
    }
  }

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab)
        router.replace(`/dashboard?tab=${tab}`, { scroll: false })
      }}
    >
      {renderContent()}
    </DashboardLayout>
  )
}

export function DashboardClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  )
}
