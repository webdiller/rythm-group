"use client"

/**
 * Вход на маршрут: полноэкранный тёмный слой исчезает, контент плавно проявляется (одна кривая и длительность для всех).
 */
export function PageEnterReveal({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="page-enter-reveal-root relative">
      <div className="page-enter-reveal-content">{children}</div>
      <div className="page-enter-reveal-overlay fixed inset-0 z-100 bg-[#0A0A0F]" aria-hidden="true" />
    </div>
  )
}
