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
        {children}
        <Analytics />
      </body>
    </html>
  )
}
