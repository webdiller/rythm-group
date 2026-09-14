import type { Metadata, Viewport } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { RootShellProviders } from "@/components/RootShellProviders"
import { getRootShellBackgroundFlags, getSiteFaviconHref } from "@/lib/server/root-shell-meta"
import { getInitialTranslations } from "@/lib/server/initial-translations"
import "./globals.css"

/** CMS (SQLite) должен читаться на каждый запрос, не при сборке. */
export const dynamic = "force-dynamic"

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "Rythm Group — Gaming & Esports Media Holding",
  description: "Крупнейший игровой, киберспортивный и медийный холдинг в Telegram. The largest gaming, esports & media holding in Telegram.",
  keywords: ["gaming", "esports", "telegram", "media", "advertising", "rythm group"],
  openGraph: {
    title: "Rythm Group — Gaming & Esports Media Holding",
    description: "Крупнейший игровой, киберспортивный и медийный холдинг в Telegram.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { hasAnyCustomBackgrounds, prefetchBackgroundSrcs } = await getRootShellBackgroundFlags()
  const faviconHref = getSiteFaviconHref()
  const initialTranslations = getInitialTranslations("ru")

  return (
    <html
      lang="ru"
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href={faviconHref}
        />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <RootShellProviders
            hasAnyCustomBackgrounds={hasAnyCustomBackgrounds}
            prefetchBackgroundSrcs={prefetchBackgroundSrcs}
            initialTranslations={initialTranslations}
          >
            {children}
          </RootShellProviders>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
