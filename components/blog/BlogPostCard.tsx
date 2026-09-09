"use client"

import Link from "next/link"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { useLocale } from "@/lib/locale-context"
import type { BlogCategory, BlogPost } from "@/lib/blog/types"
import { getPostCanonicalPath } from "@/lib/blog/paths"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type BlogPostCardProps = {
	post: BlogPost
	category: BlogCategory | undefined
	showDates?: boolean
}

export function BlogPostCard({ post, category, showDates = true }: BlogPostCardProps) {
	const { locale, t } = useLocale()
	const title = locale === "en" ? post.title_en : post.title_ru
	const excerpt = locale === "en" ? post.excerpt_en : post.excerpt_ru
	const categoryLabel = category != null ? (locale === "en" ? category.name_en : category.name_ru) : post.category_slug
	const href = getPostCanonicalPath(post)
	const dateLocale = locale === "en" ? enUS : ru
	const formattedDate = showDates ? format(new Date(post.published_at), "d MMMM yyyy", { locale: dateLocale }) : null

	return (
		<Card className="group h-full overflow-hidden border-border/80 bg-card/80 py-0 shadow-none backdrop-blur-sm transition-colors hover:border-primary/35">
			{post.cover_image_url ? (
				<Link
					href={href}
					className="relative block aspect-video w-full shrink-0 overflow-hidden bg-muted"
				>
					<img
						src={post.cover_image_url}
						alt=""
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
						loading="lazy"
						decoding="async"
					/>
				</Link>
			) : null}
			<CardHeader className="gap-3 p-6 pb-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge
						variant="secondary"
						className="font-normal text-muted-foreground"
					>
						{categoryLabel}
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
				<h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
					<Link
						href={href}
						className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
					>
						{title}
					</Link>
				</h2>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 p-6 pt-0">
				<p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{excerpt}</p>
				<Link
					href={href}
					className="inline-flex w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline"
				>
					{t.blog.readMore}
				</Link>
			</CardContent>
		</Card>
	)
}
