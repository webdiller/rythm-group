"use client"

import { CSSProperties, useEffect, useState } from "react"

export type UseStaggerVisibleOptions = {
  /** Задержка в ms перед началом анимации для каждого следующего элемента (по умолчанию 80) */
  delayStep?: number
  /** Дополнительная задержка в ms перед стартом всей последовательности (по умолчанию 0) */
  delayStart?: number
}

/**
 * Хук для поочерёдного появления элементов при монтировании.
 * Возвращает флаг visible (становится true после mount) и style с transitionDelay по индексу.
 * Используйте вместе с компонентом StaggerItem или примените классы/стили самостоятельно.
 */
export function useStaggerVisible(
  index: number,
  options: UseStaggerVisibleOptions = {},
): { visible: boolean; style: CSSProperties } {
  const { delayStep = 80, delayStart = 0 } = options
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayStart)
    return () => clearTimeout(t)
  }, [delayStart])

  const style: CSSProperties = {
    transitionDelay: `${delayStart + index * delayStep}ms`,
  }

  return { visible, style }
}
