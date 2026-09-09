"use client"

import Link from "next/link"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import { AFFILIATE_MINI_BLOG_MOCK, AFFILIATE_UI_MOCK } from "@/lib/affiliate/mock-data"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AffiliateMiniBlog() {
	const { locale, t } = useLocale()
	const showDates = AFFILIATE_UI_MOCK.showPostDates
	const dateLocale = locale === "en" ? enUS : ru
	const posts = AFFILIATE_MINI_BLOG_MOCK.slice(0, 6)

	return (
		<section
			id="affiliate-feed"
			className="border-y border-border/60 bg-muted/20 py-16 md:py-20"
		>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div className="max-w-3xl space-y-3">
						<h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.affiliate.miniBlog.title}</h2>
						<p className="text-base text-muted-foreground sm:text-lg">{t.affiliate.miniBlog.subtitle}</p>
					</div>
					<Link
						href="/blog"
						className="inline-flex w-fit shrink-0 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
					>
						{t.affiliate.miniBlog.goToBlog}
					</Link>
				</div>

				<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{posts.map((post) => {
						const title = locale === "en" ? post.title_en : post.title_ru
						const excerpt = locale === "en" ? post.excerpt_en : post.excerpt_ru
						const cat = locale === "en" ? post.category_en : post.category_ru
						const formattedDate = showDates ? format(new Date(post.published_at), "d MMMM yyyy", { locale: dateLocale }) : null

						return (
							<Card
								key={post.id}
								className="group h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-colors hover:border-primary/35"
							>
								{post.cover_image_url ? (
									<div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
										<img
											src={post.cover_image_url}
											alt=""
											className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
											loading="lazy"
											decoding="async"
										/>
									</div>
								) : (
									<div
										className="aspect-video w-full bg-muted/80"
										aria-hidden
									/>
								)}
								<CardHeader className="gap-3 p-6 pb-2">
									<div className="flex flex-wrap items-center gap-2">
										<Badge
											variant="secondary"
											className="font-normal text-muted-foreground"
										>
											{cat}
										</Badge>
										{formattedDate && (
											<time
												className="text-xs text-muted-foreground"
												dateTime={post.published_at}
											>
												{formattedDate}
											</time>
										)}
									</div>
									<h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">{title}</h3>
								</CardHeader>
								<CardContent className="p-6 pt-0">
									<p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</div>
		</section>
	)
}
