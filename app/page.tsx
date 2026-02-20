"use client"

import { LocaleProvider } from "@/lib/locale-context"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Channels } from "@/components/channels"
import { About } from "@/components/about"
import { Stats } from "@/components/stats"
import { Cases } from "@/components/cases"
import { ContactForm } from "@/components/contact-form"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <LocaleProvider>
      <Header />
      <main>
        <Hero />
        <Channels />
        <About />
        <Stats />
        <Cases />
        <ContactForm />
      </main>
      <Footer />
    </LocaleProvider>
  )
}
