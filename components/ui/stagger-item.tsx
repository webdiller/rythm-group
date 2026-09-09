"use client"

import { type ReactNode } from "react"
import clsx from "clsx"
import { useStaggerVisible, type UseStaggerVisibleOptions } from "@/lib/useStaggerVisible"

export type StaggerItemProps = UseStaggerVisibleOptions & {
	/** Порядковый индекс элемента (0, 1, 2, …) для поочерёдной задержки */
	index: number
	children: ReactNode
	/** Дополнительные классы для обёртки */
	className?: string
	/** Классы в видимом состоянии (по умолчанию: opacity-100) */
	visibleClassName?: string
	/** Классы в скрытом состоянии (по умолчанию: opacity-0). Без translate, чтобы не вызывать CLS. */
	hiddenClassName?: string
	/** Длительность перехода в Tailwind (по умолчанию duration-500) */
	durationClassName?: string
}

/**
 * Обёртка для поочерёдной плавной анимации появления при загрузке страницы.
 * Подходит для списков: услуги, проекты, карточки блога и т.п.
 *
 * @example
 * {items.map((item, i) => (
 *   <StaggerItem key={item.id} index={i}>
 *     <Card>{item.title}</Card>
 *   </StaggerItem>
 * ))}
 */
export function StaggerItem({ index, children, className, visibleClassName = "translate-y-0 opacity-100", hiddenClassName = "translate-y-2 opacity-0", durationClassName = "duration-500", delayStep = 80, delayStart = 0, onceKey, disabled = false }: StaggerItemProps) {
	const { visible, style } = useStaggerVisible(index, { delayStep, delayStart, onceKey, disabled })

	return (
		<div
			style={style}
			className={clsx("transform transition-all ease-out h-full", durationClassName, visible ? visibleClassName : hiddenClassName, className)}
		>
			{children}
		</div>
	)
}
