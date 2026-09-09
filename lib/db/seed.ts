import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import type * as schema from "./schema"
import { isNull } from "drizzle-orm"
import { tableTranslations, tableChannelCategories, tableChannels, tablePartnerCategories, tablePartners, tableContacts, tableBlogCategories, tableBlogPosts, tableSiteSettings, tableAffiliateHero, tableAffiliateFormats, tableAffiliateFaq, tableAboutCards } from "./schema"
import { fallbackTranslations } from "@/lib/i18n"
import { channelCategories, partnerLogos } from "@/lib/data"
import { DEFAULT_HEADER_NAV_ORDER } from "@/lib/header-nav"

function insertNested(insert: (locale: string, section: string, fullKey: string, value: string) => void, locale: string, section: string, prefix: string, data: Record<string, unknown>) {
	for (const [key, value] of Object.entries(data)) {
		const fullKey = prefix ? `${prefix}.${key}` : key
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			insertNested(insert, locale, section, fullKey, value as Record<string, unknown>)
		} else if (Array.isArray(value)) {
			insert(locale, section, fullKey, JSON.stringify(value))
		} else {
			insert(locale, section, fullKey, String(value))
		}
	}
}

export function runSeed(db: BetterSQLite3Database<typeof schema>) {
	const existingTranslations = db.select().from(tableTranslations).limit(1).all()
	if (existingTranslations.length === 0) {
		for (const [locale, localeData] of Object.entries(fallbackTranslations)) {
			for (const [section, sectionData] of Object.entries(localeData as Record<string, Record<string, unknown>>)) {
				insertNested(
					(loc, sec, fullKey, value) => {
						db.insert(tableTranslations).values({ locale: loc, section: sec, key: fullKey, value }).run()
					},
					locale,
					section,
					"",
					sectionData,
				)
			}
		}
	}

	const existingCategories = db.select().from(tableChannelCategories).limit(1).all()
	if (existingCategories.length === 0) {
		for (let catIndex = 0; catIndex < channelCategories.length; catIndex++) {
			const category = channelCategories[catIndex]
			db.insert(tableChannelCategories)
				.values({
					id: category.id,
					name_ru: category.nameRu,
					name_en: category.nameEn,
					order_index: catIndex,
				})
				.run()
			for (let chIndex = 0; chIndex < category.channels.length; chIndex++) {
				const ch = category.channels[chIndex]
				const reachDemo = `${(0.7 + (chIndex % 8) * 0.12 + catIndex * 0.05).toFixed(1)}M`
				db.insert(tableChannels)
					.values({
						category_id: category.id,
						name: ch.name,
						subscribers: ch.subscribers,
						reach: reachDemo,
						url: ch.url,
						order_index: chIndex,
						avatar: null,
					})
					.run()
			}
		}
	}

	const existingPartnerCategories = db.select().from(tablePartnerCategories).limit(1).all()
	let defaultPartnerCategoryId: number | null = null
	if (existingPartnerCategories.length === 0) {
		const [inserted] = db.insert(tablePartnerCategories).values({ name: "Партнёры", name_ru: "Партнёры", name_en: "Partners", order_index: 0 }).returning().all()
		if (inserted) defaultPartnerCategoryId = inserted.id
	} else {
		defaultPartnerCategoryId = existingPartnerCategories[0].id
	}

	const existingPartners = db.select().from(tablePartners).limit(1).all()
	if (existingPartners.length === 0 && defaultPartnerCategoryId != null) {
		for (let i = 0; i < partnerLogos.length; i++) {
			db.insert(tablePartners)
				.values({
					category_id: defaultPartnerCategoryId,
					name: partnerLogos[i].name,
					logo_url: null,
					order_index: i,
				})
				.run()
		}
	}

	const existingContacts = db.select().from(tableContacts).limit(1).all()
	if (existingContacts.length === 0) {
		db.insert(tableContacts)
			.values({
				scope: "landing",
				email: "contact@rythmgroup.com",
				telegram_url: "https://t.me/RythmGroup",
				telegram_username: "@RythmGroup",
				direct_contacts: JSON.stringify([
					{
						id: "telegram-main",
						label: "Telegram",
						description: "@RythmGroup",
						url: "https://t.me/RythmGroup",
						type: "telegram",
					},
					{
						id: "email-main",
						label: "Email",
						description: "contact@rythmgroup.com",
						url: "mailto:contact@rythmgroup.com",
						type: "email",
					},
				]),
				mini_stats: JSON.stringify([
					{
						id: "fastResponse",
						value: "24/7",
						label_ru: "Быстрый ответ",
						label_en: "Fast response",
					},
					{ id: "support", value: "< 1h", label_ru: "Поддержка", label_en: "Support" },
				]),
			})
			.run()
	}

	const existingBlogCats = db.select().from(tableBlogCategories).limit(1).all()
	if (existingBlogCats.length === 0) {
		const seedCats = [
			{ slug: "news", name_ru: "Новости", name_en: "News", order_index: 0 },
			{ slug: "cases", name_ru: "Кейсы", name_en: "Cases", order_index: 1 },
			{ slug: "statistics", name_ru: "Статистика", name_en: "Statistics", order_index: 2 },
			{ slug: "memes", name_ru: "Мемы", name_en: "Memes", order_index: 3 },
		]
		for (const c of seedCats) {
			db.insert(tableBlogCategories)
				.values({ ...c, deleted_at: null })
				.run()
		}
	}

	const existingSettings = db.select().from(tableSiteSettings).limit(1).all()
	if (existingSettings.length === 0) {
		db.insert(tableSiteSettings)
			.values({
				favicon: null,
				logo: null,
				logo_text: null,
				privacyPolicyUrl: null,
				dataProcessingPolicyUrl: null,
				headerNavOrder: JSON.stringify(DEFAULT_HEADER_NAV_ORDER),
				heroAnimationEnabled: true,
				partnersDisplayMode: "logoAndName",
				channels_show_subscribers: true,
				channels_show_reach: true,
				channels_card_align: "left",
				contactLayout: "formFirst",
				contactFormHidden: false,
				affiliate_contact_layout: "formFirst",
				affiliate_contact_form_hidden: false,
				blog_show_dates: true,
				affiliate_show_blog_block: true,
				affiliate_show_hero: true,
				affiliate_show_formats: true,
				affiliate_show_cases: true,
				affiliate_show_steam: true,
				affiliate_show_faq: true,
				affiliate_show_contacts: true,
				page_blog_enabled: true,
				page_affiliate_enabled: true,
				site_published: true,
			})
			.run()
	}

	const existingAffiliateHero = db.select().from(tableAffiliateHero).limit(1).all()
	if (existingAffiliateHero.length === 0) {
		db.insert(tableAffiliateHero)
			.values({
				badge_ru: "Партнёрство GameDev / Маркетинг",
				badge_en: "GameDev / Marketing partnerships",
				title_ru: "Продвижение игр и медийные партнёрства",
				title_en: "Game promotion & media partnerships",
				subtitle_ru: "Кейсы с вишлистами и релизами, прозрачная статистика и команда, которая говорит на языке разработчиков и издателей.",
				subtitle_en: "Case studies with wishlists and launches, clear stats, and a team that speaks developer and publisher.",
				cta_primary_ru: "Подать заявку",
				cta_primary_en: "Apply",
				cta_secondary_ru: "Подробнее",
				cta_secondary_en: "Learn more",
			})
			.run()
	}
	const existingAffiliateFormats = db.select().from(tableAffiliateFormats).limit(1).all()
	if (existingAffiliateFormats.length === 0) {
		db.insert(tableAffiliateFormats)
			.values([
				{
					title_ru: "Вишлисты Steam",
					title_en: "Steam wishlists",
					body_ru: "Продвижение игры с фокусом на добавления в вишлист.",
					body_en: "Game promotion focused on wishlist adds.",
					hidden: false,
					order_index: 0,
				},
				{
					title_ru: "Рекламный формат",
					title_en: "Advertising",
					body_ru: "Размещение рекламных интеграций в Telegram.",
					body_en: "Ad integrations in Telegram channels.",
					hidden: false,
					order_index: 1,
				},
			])
			.run()
	}
	const existingAffiliateFaq = db.select().from(tableAffiliateFaq).limit(1).all()
	if (existingAffiliateFaq.length === 0) {
		db.insert(tableAffiliateFaq)
			.values([
				{
					question_ru: "Нужна ли предоплата?",
					question_en: "Is a prepayment required?",
					answer_ru: "Зависит от формата сотрудничества.",
					answer_en: "Depends on the cooperation format.",
					hidden: false,
					order_index: 0,
				},
			])
			.run()
	}

	const existingAboutCards = db.select().from(tableAboutCards).limit(1).all()
	if (existingAboutCards.length === 0) {
		const ruAbout = fallbackTranslations.ru.about
		const enAbout = fallbackTranslations.en.about
		db.insert(tableAboutCards)
			.values([
				{
					icon: "Target",
					title_ru: ruAbout.mission.title,
					title_en: enAbout.mission.title,
					text_ru: ruAbout.mission.text,
					text_en: enAbout.mission.text,
					hidden: false,
					order_index: 0,
				},
				{
					icon: "Users",
					title_ru: ruAbout.team.title,
					title_en: enAbout.team.title,
					text_ru: ruAbout.team.text,
					text_en: enAbout.team.text,
					hidden: false,
					order_index: 1,
				},
				{
					icon: "Crosshair",
					title_ru: ruAbout.audience.title,
					title_en: enAbout.audience.title,
					text_ru: ruAbout.audience.text,
					text_en: enAbout.audience.text,
					hidden: false,
					order_index: 2,
				},
			])
			.run()
	}

	const existingBlogPosts = db.select().from(tableBlogPosts).limit(1).all()
	if (existingBlogPosts.length === 0) {
		const catRows = db.select({ id: tableBlogCategories.id, slug: tableBlogCategories.slug }).from(tableBlogCategories).where(isNull(tableBlogCategories.deleted_at)).all()
		const bySlug = Object.fromEntries(catRows.map((r) => [r.slug, r.id])) as Record<string, number>

		const newsId = bySlug["news"]
		const casesId = bySlug["cases"]
		const statisticsId = bySlug["statistics"]
		const memesId = bySlug["memes"]

		if (newsId && casesId && statisticsId && memesId) {
			const isoNow = new Date().toISOString()
			const u = (iso: string) => Math.floor(new Date(iso).getTime() / 1000)

			const seedPosts: Array<{
				category_id: number
				slug: string
				title_ru: string
				title_en: string
				excerpt_ru: string
				excerpt_en: string
				body_html_ru: string
				body_html_en: string
				cover_image_url: string | null
				status: "draft" | "published"
				published_at: number
			}> = [
				{
					category_id: casesId,
					slug: "wishlist-two-weeks",
					title_ru: "Как мы собирали вишлисты за две недели",
					title_en: "How we built wishlists in two weeks",
					excerpt_ru: "Разбор метрик, тайминга постов и работы с комьюнити.",
					excerpt_en: "Metrics, post timing, and community work — a short breakdown.",
					body_html_ru: "<p>Короткий разбор кампании: какие каналы дали лучший CPL по вишлисту и как мы перераспределяли слоты.</p><h2>Что сработало</h2><ul><li>серия постов с демо</li><li>коллаборации с тематическими каналами</li></ul>",
					body_html_en: "<p>A short campaign breakdown: which channels drove the best wishlist CPL and how we shifted slots.</p><h2>What worked</h2><ul><li>demo-focused post series</li><li>collabs with themed channels</li></ul>",
					cover_image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
					status: "published",
					published_at: u("2025-02-01T12:00:00.000Z"),
				},
				{
					category_id: statisticsId,
					slug: "reach-vs-conversion",
					title_ru: "Охваты vs конверсия в Telegram",
					title_en: "Reach vs conversion in Telegram",
					excerpt_ru: "Что смотреть в отчётах, если цель — вишлист, а не только просмотры.",
					excerpt_en: "What to track when the goal is wishlists, not only views.",
					body_html_ru: "<p>Охват показывает масштаб, а конверсия — качество трафика. Для игровых кампаний важно смотреть оба показателя в связке.</p><p><strong>Совет:</strong> фиксируйте UTM и сравнивайте добавления в вишлист по источникам.</p>",
					body_html_en: "<p>Reach shows scale; conversion shows traffic quality. For game campaigns, track both together.</p><p><strong>Tip:</strong> use UTM tags and compare wishlist adds by source.</p>",
					cover_image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
					status: "published",
					published_at: u("2025-01-20T10:00:00.000Z"),
				},
				{
					category_id: newsId,
					slug: "march-indie-slots",
					title_ru: "Новые слоты для инди в марте",
					title_en: "New indie slots in March",
					excerpt_ru: "Открыли дополнительные окна для нативных интеграций.",
					excerpt_en: "Additional windows opened for native integrations.",
					body_html_ru: "<p>В марте доступны дополнительные слоты для инди-проектов. Напишите нам в Telegram, чтобы забронировать время.</p>",
					body_html_en: "<p>Extra slots for indie projects are available in March. Message us on Telegram to reserve a slot.</p>",
					cover_image_url: null,
					status: "published",
					published_at: u("2025-01-05T09:00:00.000Z"),
				},
				{
					category_id: memesId,
					slug: "friday-meme-01",
					title_ru: "Пятничный мем про дедлайны",
					title_en: "Friday meme about deadlines",
					excerpt_ru: "Короткий пост для настроя команды перед релизом.",
					excerpt_en: "A short morale post before the release.",
					body_html_ru: "<p>Когда билд зелёный, но душа требует ещё одного хотфикса…</p>",
					body_html_en: "<p>When the build is green but your soul needs one more hotfix…</p>",
					cover_image_url: "https://images.unsplash.com/photo-1614854262340-ab1ca7d079c7?w=1200&q=80",
					status: "published",
					published_at: u("2025-01-12T15:30:00.000Z"),
				},
				{
					category_id: newsId,
					slug: "draft-internal-note",
					title_ru: "[Черновик] Анонс для команды",
					title_en: "[Draft] Internal announcement",
					excerpt_ru: "Черновая запись для проверки фильтра в админке.",
					excerpt_en: "Draft entry to verify admin filters.",
					body_html_ru: "<p>Текст черновика — на сайте не отображается.</p>",
					body_html_en: "<p>Draft body — not shown on the public site.</p>",
					cover_image_url: null,
					status: "draft",
					published_at: u("2025-03-01T08:00:00.000Z"),
				},
			]

			for (const p of seedPosts) {
				db.insert(tableBlogPosts)
					.values({
						category_id: p.category_id,
						slug: p.slug,
						title_ru: p.title_ru,
						title_en: p.title_en,
						excerpt_ru: p.excerpt_ru,
						excerpt_en: p.excerpt_en,
						body_html_ru: p.body_html_ru,
						body_html_en: p.body_html_en,
						cover_image_url: p.cover_image_url,
						status: p.status,
						published_at: p.published_at,
						deleted_at: null,
						created_at: isoNow,
						updated_at: isoNow,
					})
					.run()
			}
		}
	}
}
