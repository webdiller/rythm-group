import type { BlogPost } from "./types"

/** Канонический URL записи (без серверных зависимостей — для клиентских компонентов). */
export function getPostCanonicalPath(post: BlogPost): string {
	return `/blog/${post.category_slug}/${post.slug}`
}
