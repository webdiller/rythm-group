"use client"

import { useEffect, useRef, useState } from "react"

export type UseIntersectionObserverOptions = {
  /** Порог видимости (0-1), при котором срабатывает callback (по умолчанию 0.1) */
  threshold?: number
  /** Отступ от края viewport в px (по умолчанию 0) */
  rootMargin?: string
  /** Запускать анимацию только один раз (по умолчанию true) */
  triggerOnce?: boolean
}

/**
 * Хук для отслеживания попадания элемента в видимую область viewport.
 * Использует Intersection Observer API для определения видимости элемента.
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLElement>, boolean] {
  const {
    threshold = 0.1,
    rootMargin = "0px",
    triggerOnce = true,
  } = options

  const elementRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, triggerOnce])

  return [elementRef, isVisible]
}
