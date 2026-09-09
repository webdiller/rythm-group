/** Ссылки на секции главной: на подстраницах префикс `/#…`, иначе якорь `#…`. Пути вроде `/blog` не трогаем. */
export function resolveNavHref(href: string, sectionPrefix: "" | "/"): string {
	if (href.startsWith("/") && !href.startsWith("/#")) return href
	if (sectionPrefix === "/") {
		return href.startsWith("#") ? `/${href}` : href
	}
	return href
}
