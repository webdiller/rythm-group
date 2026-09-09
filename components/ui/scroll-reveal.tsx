"use client"

import { type ReactNode, useRef, useEffect, useState } from "react"
import clsx from "clsx"
import { useIntersectionObserver } from "@/lib/useIntersectionObserver"

export type ScrollRevealProps = {
	children: ReactNode
	/** Дополнительные классы для обёртки */
	className?: string
	/** Классы в видимом состоянии (по умолчанию: translate-y-0 opacity-100) */
	visibleClassName?: string
	/** Классы в скрытом состоянии (по умолчанию: translate-y-8 opacity-0) */
	hiddenClassName?: string
	/** Длительность перехода в Tailwind (по умолчанию duration-700) */
	durationClassName?: string
	/** Порог видимости (0-1) для Intersection Observer (по умолчанию 0.1) */
	threshold?: number
	/** Отступ от края viewport (по умолчанию "50px") */
	rootMargin?: string
	/** Запускать анимацию только один раз (по умолчанию true) */
	triggerOnce?: boolean
	/** Отключить анимацию и всегда показывать содержимое */
	disabled?: boolean
}

/**
 * Компонент для анимации появления элементов при попадании в видимую область viewport.
 * Использует Intersection Observer API для отслеживания скролла.
 *
 * @example
 * <ScrollReveal>
 *   <div>Content that animates on scroll</div>
 * </ScrollReveal>
 */
export function ScrollReveal({ children, className, visibleClassName = "translate-y-0 opacity-100", hiddenClassName = "translate-y-8 opacity-0", durationClassName = "duration-700", threshold = 0.1, rootMargin = "50px", triggerOnce = true, disabled = false }: ScrollRevealProps) {
	if (disabled) {
		return <div className={className}>{children}</div>
	}

	const [elementRef, isVisible] = useIntersectionObserver({
		threshold,
		rootMargin,
		triggerOnce,
	})

	return (
		<div
			ref={elementRef as React.RefObject<HTMLDivElement>}
			className={clsx("transform transition-all ease-out", durationClassName, isVisible ? visibleClassName : hiddenClassName, className)}
		>
			{children}
		</div>
	)
}
