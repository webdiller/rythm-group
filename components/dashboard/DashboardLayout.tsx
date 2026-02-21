"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, FileText, Tv, Users, Mail } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = "auth_token=; path=/; max-age=0"
    router.push("/dashboard/login")
  }

  const tabs = [
    { id: "translations", label: "Переводы", icon: FileText },
    { id: "channels", label: "Каналы", icon: Tv },
    { id: "partners", label: "Партнёры", icon: Users },
    { id: "contacts", label: "Контакты", icon: Mail },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold">CMS Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Выход
          </Button>
        </div>
      </header>
      <div className="container mx-auto flex gap-6 p-6">
        <aside className="w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
