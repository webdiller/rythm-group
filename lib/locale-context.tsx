"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { fallbackTranslations, type Locale, type Translations, setNestedValue } from "./i18n"

interface LocaleContextType {
	locale: Locale
	setLocale: (locale: Locale) => void
	t: Translations
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

export function LocaleProvider({ children, initialLocale = "ru", initialTranslations }: { children: ReactNode; initialLocale?: Locale; initialTranslations?: Translations }) {
	const [locale, setLocale] = useState<Locale>(initialLocale)
	const [translations, setTranslations] = useState<Translations>(() => initialTranslations ?? (JSON.parse(JSON.stringify(fallbackTranslations[initialLocale])) as Translations))

	useEffect(() => {
		// Load translations from API on client side
		async function loadTranslations() {
			try {
				const response = await fetch(`/api/content/translations?locale=${locale}`)
				if (response.ok) {
					const json = (await response.json()) as {
						data?: Array<{ section: string; key: string; value: string }>
					}
					const dbTranslations = json.data ?? []

					// Start with fallback translations (deep clone to avoid readonly issues)
					const t = JSON.parse(JSON.stringify(fallbackTranslations[locale])) as any

					// Override with database values
					for (const row of dbTranslations) {
						try {
							// Try to parse JSON if it looks like JSON (arrays or objects)
							let value: any = row.value
							if (row.value && (row.value.startsWith("[") || row.value.startsWith("{"))) {
								try {
									value = JSON.parse(row.value)
								} catch {
									// If parsing fails, use the string value as-is
									value = row.value
								}
							}

							// Check if this key should be an array (like stats.items or contact.budgetOptions)
							const shouldBeArray = row.key === "items" || row.key === "budgetOptions"
							if (shouldBeArray && !Array.isArray(value)) {
								// If it should be an array but isn't, skip this value and use fallback
								console.warn(`Skipping invalid array value for ${row.section}.${row.key}, using fallback`)
								continue
							}

							setNestedValue(t, `${row.section}.${row.key}`, value)
						} catch (error) {
							// Skip invalid nested paths
							console.warn(`Failed to set translation ${row.section}.${row.key}:`, error)
						}
					}

					setTranslations(t as Translations)
				} else {
					// Fallback to static translations
					setTranslations(JSON.parse(JSON.stringify(fallbackTranslations[locale])) as Translations)
				}
			} catch (error) {
				console.error("Failed to load translations:", error)
				// Fallback to static translations
				setTranslations(JSON.parse(JSON.stringify(fallbackTranslations[locale])) as Translations)
			}
		}

		loadTranslations()
	}, [locale])

	return <LocaleContext.Provider value={{ locale, setLocale, t: translations }}>{children}</LocaleContext.Provider>
}

export function useLocale() {
	const context = useContext(LocaleContext)
	if (!context) throw new Error("useLocale must be used within LocaleProvider")
	return context
}
