import type { ReactNode } from "react"
import { Toaster } from "@/components/ui/sonner"

type DashboardLayoutProps = {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  )
}
