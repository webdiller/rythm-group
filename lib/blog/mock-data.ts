import type { BlogCategory, BlogPost } from "./types"

/** Заглушка до появления таблиц блога в БД (ТЗ п. 3.1–3.2). */
export const mockBlogCategories: BlogCategory[] = [
  { id: "1", slug: "news", name_ru: "Новости", name_en: "News", order_index: 0 },
  { id: "2", slug: "cases", name_ru: "Кейсы", name_en: "Cases", order_index: 1 },
  { id: "3", slug: "statistics", name_ru: "Статистика", name_en: "Statistics", order_index: 2 },
  { id: "4", slug: "memes", name_ru: "Мемы", name_en: "Memes", order_index: 3 },
]

export const mockBlogPosts: BlogPost[] = [
  {
    id: "p1",
    category_slug: "news",
    slug: "platform-update-q1",
    title_ru: "Обновление платформы: что нового в первом квартале",
    title_en: "Platform update: what is new in Q1",
    excerpt_ru: "Кратко о релизах, метриках и планах по развитию партнёрских инструментов для издателей и студий.",
    excerpt_en: "A short overview of releases, metrics, and roadmap for partner tooling for publishers and studios.",
    cover_image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=960&q=80&auto=format&fit=crop",
    body_html_ru: `
<p>Мы продолжаем развивать экосистему каналов и инструментов для партнёров. В этом материале — ключевые изменения и ориентиры на ближайшие спринты.</p>
<h2>Что изменилось</h2>
<ul>
<li>Улучшена стабильность отчётов по охватам</li>
<li>Добавлены шаблоны для быстрых согласований</li>
<li>Обновлены рекомендации по креативам под Telegram</li>
</ul>
<h2>Дальше</h2>
<p>Следите за разделом <strong>Новости</strong> — там появятся детали по интеграциям и форматам размещений.</p>
<p><a href="https://t.me" target="_blank" rel="noopener noreferrer">Подписаться на канал</a></p>
    `.trim(),
    body_html_en: `
<p>We keep evolving our channel ecosystem and partner tooling. Here are the highlights and what to expect next.</p>
<h2>What changed</h2>
<ul>
<li>More stable reach reporting</li>
<li>Templates for faster approvals</li>
<li>Updated creative guidance for Telegram</li>
</ul>
<h2>What is next</h2>
<p>Watch the <strong>News</strong> category for integration updates and placement formats.</p>
<p><a href="https://t.me" target="_blank" rel="noopener noreferrer">Subscribe to the channel</a></p>
    `.trim(),
    published_at: "2025-02-10T10:00:00.000Z",
    created_at: "2025-02-10T09:30:00.000Z",
  },
  {
    id: "p2",
    category_slug: "cases",
    slug: "wishlist-campaign-30-days",
    title_ru: "Кейс: вишлисты за 30 дней до релиза",
    title_en: "Case study: wishlists 30 days before launch",
    excerpt_ru: "Как выстроили воронку, какие каналы дали лучший CPL и что важно учесть издателю.",
    excerpt_en: "How we structured the funnel, which channels performed best, and what publishers should plan for.",
    cover_image_url: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=960&q=80&auto=format&fit=crop",
    body_html_ru: `
<p>Задача — набрать осмысленный объём вишлистов в короткий срок без «сжигания» бюджета на холодной аудитории.</p>
<h2>Стратегия</h2>
<p>Мы сфокусировались на <em>последовательных касаниях</em>: анонс → социальное доказательство → напоминание с дедлайном.</p>
<h2>Результат</h2>
<p>Показатели и скриншоты статистики будут добавлены из админки; здесь — пример структуры материала для страницы записи.</p>
    `.trim(),
    body_html_en: `
<p>The goal was to grow meaningful wishlists quickly without overspending on cold audiences.</p>
<h2>Strategy</h2>
<p>We focused on <em>sequenced touchpoints</em>: announcement → social proof → deadline reminder.</p>
<h2>Outcome</h2>
<p>Metrics and screenshots will be managed in the admin UI; this mock shows the article layout.</p>
    `.trim(),
    published_at: "2025-02-05T12:00:00.000Z",
    created_at: "2025-02-05T11:00:00.000Z",
  },
  {
    id: "p3",
    category_slug: "statistics",
    slug: "telegram-gaming-reach-2024",
    title_ru: "Статистика: охваты gaming-каналов в 2024",
    title_en: "Statistics: gaming channel reach in 2024",
    excerpt_ru: "Сводка по росту аудитории, сезонности и типам контента, которые дают удержание.",
    excerpt_en: "A summary of audience growth, seasonality, and content types that improve retention.",
    cover_image_url: null,
    body_html_ru: `
<p>Это демонстрационный текст для проверки типографики: абзацы, подзаголовки и списки должны читаться одинаково хорошо в тёмной и светлой теме.</p>
<h2>Выводы</h2>
<ol>
<li>Пики активности привязаны к релизам и турнирам</li>
<li>Короткие нарезки стабильно переигрывают длинные посты по ER</li>
<li>Кросс-постинг усиливает охват, если сохранён единый tone of voice</li>
</ol>
    `.trim(),
    body_html_en: `
<p>This is placeholder copy to validate typography: paragraphs, subheadings, and lists should read well in both themes.</p>
<h2>Takeaways</h2>
<ol>
<li>Activity spikes align with releases and tournaments</li>
<li>Short clips consistently outperform long posts on engagement rate</li>
<li>Cross-posting helps reach when tone of voice stays consistent</li>
</ol>
    `.trim(),
    published_at: "2025-01-20T09:00:00.000Z",
    created_at: "2025-01-20T08:45:00.000Z",
  },
  {
    id: "p4",
    category_slug: "memes",
    slug: "friday-meme-digest",
    title_ru: "Пятничный дайджест мемов",
    title_en: "Friday meme digest",
    excerpt_ru: "Лёгкий выпуск для сообщества: без лишнего текста, только настроение недели.",
    excerpt_en: "A light community post: less text, more of the week’s vibe.",
    cover_image_url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=960&q=80&auto=format&fit=crop",
    body_html_ru: "<p>Здесь могут быть изображения и подписи (медиа подключатся после интеграции хранилища S3).</p>",
    body_html_en: "<p>Images and captions can live here (media will be wired after S3 integration).</p>",
    published_at: "2025-01-10T18:00:00.000Z",
    created_at: "2025-01-10T17:50:00.000Z",
  },
]
