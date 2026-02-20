import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: 'Rythm Group — Gaming & Esports Media Holding',
  description: 'Крупнейший игровой, киберспортивный и медийный холдинг в Telegram. The largest gaming, esports & media holding in Telegram.',
  keywords: ['gaming', 'esports', 'telegram', 'media', 'advertising', 'rythm group'],
  openGraph: {
    title: 'Rythm Group — Gaming & Esports Media Holding',
    description: 'Крупнейший игровой, киберспортивный и медийный холдинг в Telegram.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <div className="min-h-screen w-full relative">
          {/* Radial Gradient Background from Top */}
          <div className="absolute inset-0 z-0 radial-gradient-bg" />
          {/* Additional subtle gradient layers for depth */}
          <div
            className="absolute inset-0 z-0 opacity-60"
            style={{
              background: "radial-gradient(100% 100% at 80% 20%, rgba(230, 27, 0, 0.08) 0%, transparent 50%)",
            }}
          />
          <div
            className="absolute inset-0 z-0 opacity-40"
            style={{
              background: "radial-gradient(100% 100% at 20% 80%, rgba(230, 27, 0, 0.06) 0%, transparent 50%)",
            }}
          />
          {/* Your Content/Components */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
