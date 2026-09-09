"use client"

import { CSSProperties, useEffect, useState } from "react"

export type UseStaggerVisibleOptions = {
  /** Задержка в ms перед началом анимации для каждого следующего элемента (по умолчанию 80) */
  delayStep?: number
  /** Дополнительная задержка в ms перед стартом всей последовательности (по умолчанию 0) */
  delayStart?: number
  /** Если указан, анимация проигрывается один раз за сессию браузера */
  onceKey?: string
  /** Если true, возвращает элемент сразу в видимом состоянии без анимации */
  disabled?: boolean
}

/**
 * Хук для поочерёдного появления элементов при монтировании.
 * Возвращает флаг visible (становится true после mount) и style с transitionDelay по индексу.
 * Используйте вместе с компонентом StaggerItem или примените классы/стили самостоятельно.
 */
export function useStaggerVisible(index: number, options: UseStaggerVisibleOptions = {}): { visible: boolean; style: CSSProperties } {
  const { delayStep = 80, delayStart = 0, onceKey, disabled = false } = options
  const [visible, setVisible] = useState(() => {
    if (disabled) return true
    if (!onceKey || typeof window === "undefined") return false
    try {
      return window.sessionStorage.getItem(onceKey) === "1"
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (disabled) {
      setVisible(true)
      return
    }

    if (onceKey && typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem(onceKey) === "1") {
          setVisible(true)
          return
        }
        // Mark immediately on first mount to avoid re-animation
        // when user navigates to another blog route very quickly.
        window.sessionStorage.setItem(onceKey, "1")
      } catch {
        // sessionStorage may be unavailable in restricted environments
      }
    }

    const t = setTimeout(() => setVisible(true), delayStart)
    return () => clearTimeout(t)
  }, [delayStart, delayStep, disabled, index, onceKey])

  const style: CSSProperties = {
    transitionDelay: `${delayStart + index * delayStep}ms`,
  }

  return { visible, style }
}
