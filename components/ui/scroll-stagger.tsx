"use client"

import { type ReactNode } from "react"
import { ScrollReveal } from "./scroll-reveal"

export type ScrollStaggerProps = {
  children: ReactNode
  /** Порядковый индекс элемента (0, 1, 2, …) для поочерёдной задержки */
  index: number
  /** Задержка в ms между элементами (по умолчанию 100) */
  delayStep?: number
  /** Дополнительные классы */
  className?: string
  /** Классы в видимом состоянии */
  visibleClassName?: string
  /** Классы в скрытом состоянии */
  hiddenClassName?: string
  /** Длительность анимации */
  durationClassName?: string
  /** Отключить анимацию и всегда показывать содержимое */
  disabled?: boolean
}

/**
 * Компонент для поочерёдной анимации элементов при скролле.
 * Используется внутри списков для создания эффекта каскадного появления.
 *
 * @example
 * {items.map((item, i) => (
 *   <ScrollStagger key={item.id} index={i}>
 *     <Card>{item.title}</Card>
 *   </ScrollStagger>
 * ))}
 */
export function ScrollStagger({ children, index, delayStep = 100, className, visibleClassName = "translate-y-0 opacity-100", hiddenClassName = "translate-y-6 opacity-0", durationClassName = "duration-700", disabled = false }: ScrollStaggerProps) {
  if (disabled) {
    return <div className={className}>{children}</div>
  }

  return (
    <ScrollReveal
      className={className}
      visibleClassName={visibleClassName}
      hiddenClassName={hiddenClassName}
      durationClassName={durationClassName}
      rootMargin="50px"
    >
      <div style={{ transitionDelay: `${index * delayStep}ms` }}>{children}</div>
    </ScrollReveal>
  )
}
