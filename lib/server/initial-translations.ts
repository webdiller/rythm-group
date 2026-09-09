import { fallbackTranslations, setNestedValue, type Locale, type Translations } from "@/lib/i18n"
import { ServiceTranslations } from "@/lib/services/translations"

export function getInitialTranslations(locale: Locale = "ru"): Translations {
	const base = JSON.parse(JSON.stringify(fallbackTranslations[locale])) as Translations
	const rows = ServiceTranslations.getAll({ locale }).data ?? []

	for (const row of rows) {
		try {
			let value: unknown = row.value
			if (row.value && (row.value.startsWith("[") || row.value.startsWith("{"))) {
				try {
					value = JSON.parse(row.value)
				} catch {
					value = row.value
				}
			}
			const shouldBeArray = row.key === "items" || row.key === "budgetOptions"
			if (shouldBeArray && !Array.isArray(value)) continue
			setNestedValue(base as unknown as Record<string, unknown>, `${row.section}.${row.key}`, value)
		} catch {
			// Ignore malformed translation rows to preserve fallback values.
		}
	}

	return base
}
