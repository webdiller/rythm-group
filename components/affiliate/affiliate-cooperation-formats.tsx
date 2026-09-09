"use client"

import { useLocale } from "@/lib/locale-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AffiliateFormatItem = {
	id: number
	title_ru: string
	title_en: string
	body_ru: string
	body_en: string
	hidden: boolean | null
}

type AffiliateCooperationFormatsProps = {
	items?: AffiliateFormatItem[]
}

export function AffiliateCooperationFormats({ items = [] }: AffiliateCooperationFormatsProps) {
	const { locale, t } = useLocale()
	const visible = items.filter((f) => !f.hidden)

	return (
		<section
			id="affiliate-formats"
			className="py-16 md:py-20"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mb-10 max-w-3xl space-y-3">
					<h2 className="font-(family-name:--font-space-grotesk) text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.affiliate.formats.title}</h2>
					<p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.formats.subtitle}</p>
				</div>
				<div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
					{visible.map((f) => (
						<Card
							key={f.id}
							className="border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-colors hover:border-primary/35"
						>
							<CardHeader className="p-6 pb-2">
								<CardTitle className="text-lg leading-snug">{locale === "en" ? f.title_en : f.title_ru}</CardTitle>
							</CardHeader>
							<CardContent className="p-6 pt-0">
								<p className="text-sm leading-relaxed text-muted-foreground">{locale === "en" ? f.body_en : f.body_ru}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	)
}
