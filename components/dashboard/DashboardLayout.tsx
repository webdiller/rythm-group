"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogOut, FileText, Tv, Users, Mail, Settings, Newspaper, IdCard } from "lucide-react"

export type DashboardTabId = "translations" | "channels" | "partners" | "about-cards" | "affiliate-sections" | "affiliate-hero" | "affiliate-formats" | "affiliate-faq" | "blog" | "contacts" | "settings"

type DashboardTab = {
	id: DashboardTabId
	label: string
	icon: LucideIcon
}

interface DashboardLayoutProps {
	children: ReactNode
	activeTab: DashboardTabId
	onTabChange: (tab: DashboardTabId) => void
}

export function DashboardLayout({ children, activeTab, onTabChange }: DashboardLayoutProps) {
	const router = useRouter()

	const handleLogout = () => {
		document.cookie = "auth_token=; path=/; max-age=0"
		router.push("/dashboard/login")
	}

	const tabs: DashboardTab[] = [
		{ id: "translations", label: "Переводы", icon: FileText },
		{ id: "channels", label: "Каналы", icon: Tv },
		{ id: "partners", label: "Партнёры (кейсы)", icon: Users },
		{ id: "about-cards", label: "О нас (карточки)", icon: IdCard },
		{ id: "blog", label: "Блог", icon: Newspaper },
		{ id: "contacts", label: "Контакты", icon: Mail },
		{ id: "settings", label: "Настройки сайта", icon: Settings },
	]
	const affiliateTabs: DashboardTab[] = [
		{ id: "affiliate-sections", label: "Секции", icon: Settings },
		{ id: "affiliate-hero", label: "Hero", icon: FileText },
		{ id: "affiliate-formats", label: "Форматы", icon: FileText },
		{ id: "affiliate-faq", label: "FAQ", icon: FileText },
	]

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b">
				<div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
					<h1 className="text-lg font-bold sm:text-xl">CMS Dashboard</h1>
					<Button
						variant="dark"
						onClick={handleLogout}
						className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
					>
						<LogOut className="mr-2 h-4 w-4" />
						<span className="hidden sm:inline">Выход</span>
					</Button>
				</div>
			</header>
			<div className="container mx-auto flex flex-col gap-4 p-4 sm:gap-6 sm:p-6 lg:flex-row">
				<aside className="w-full space-y-2 overflow-x-auto lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:shrink-0 lg:self-start lg:overflow-x-visible lg:overflow-y-auto">
					{tabs.map((tab) => {
						const Icon = tab.icon
						return (
							<button
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={`flex w-full min-w-[180px] items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors sm:px-4 sm:py-3 ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}
							>
								<Icon className="h-4 w-4 sm:h-5 sm:w-5" />
								<span className="truncate">{tab.label}</span>
							</button>
						)
					})}

					<div className="rounded-lg border border-border bg-muted/40 p-2">
						<div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affiliate</div>
						<div className="space-y-1">
							{affiliateTabs.map((tab) => {
								const Icon = tab.icon
								return (
									<button
										key={tab.id}
										onClick={() => onTabChange(tab.id)}
										className={`flex w-full min-w-[180px] items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-background/60 hover:bg-accent"}`}
									>
										<Icon className="h-4 w-4" />
										<span className="truncate">{tab.label}</span>
									</button>
								)
							})}
						</div>
					</div>
				</aside>
				<main className="w-full flex-1">{children}</main>
			</div>
		</div>
	)
}
