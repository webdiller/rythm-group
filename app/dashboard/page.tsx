"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { TranslationsEditor } from "@/components/dashboard/TranslationsEditor"
import { ChannelsEditor } from "@/components/dashboard/ChannelsEditor"
import { PartnersEditor } from "@/components/dashboard/PartnersEditor"
import { ContactsEditor } from "@/components/dashboard/ContactsEditor"

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("translations")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

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
      case "contacts":
        return <ContactsEditor />
      default:
        return <TranslationsEditor />
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}
