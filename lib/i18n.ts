export type Locale = "ru" | "en"

// Helper function to set nested translation value
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split(".")
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) {
      current[key] = {}
    }
    return current[key]
  }, obj)
  target[lastKey] = value
}

// Fallback translations (used if DB is not available or during SSR)
export const fallbackTranslations = {
  ru: {
    nav: {
      about: "О нас",
      channels: "Каналы",
      cases: "Кейсы",
      contacts: "Контакты",
      order: "Заказать рекламу",
    },
    hero: {
      title: "Rythm Group",
      subtitle: "Крупнейший игровой, киберспортивный и медийный холдинг в Telegram",
      badge: "Telegram Media Holding",
      cta: "Заказать рекламу",
      scroll: "Узнать больше",
    },
    channels: {
      title: "Наши каналы",
      subtitle: "Telegram-каналы по категориям с многомиллионной аудиторией",
      subscribers: "подписчиков",
      reach: "охват",
    },
    about: {
      title: "Кто мы",
      subtitle: "Медиахолдинг нового поколения",
      mission: {
        title: "Наша цель",
        text: "Объединяем крупнейшие Telegram-каналы в игровой и киберспортивной нише, создавая единую экосистему для рекламодателей и аудитории.",
      },
      team: {
        title: "Команда",
        text: "Более 30 профессионалов в области медиа, маркетинга и контент-продакшена работают над развитием холдинга.",
      },
      audience: {
        title: "Целевая аудитория",
        text: "Мужчины 18-35 лет, геймеры, киберспортивные фанаты, технологические энтузиасты и активные пользователи Telegram.",
      },
    },
    stats: {
      title: "Цифры говорят сами за себя",
      subtitle: "Результаты, которые мы достигли",
      items: [
        { value: "50M+", label: "Подписчиков" },
        { value: "120M+", label: "Ежемесячных охватов" },
        { value: "80+", label: "Каналов в сети" },
        { value: "500+", label: "Успешных рекламных кампаний" },
      ],
    },
    cases: {
      title: "С кем работаем",
      subtitle: "Нам доверяют крупнейшие бренды и компании",
      empty: "Партнёры пока не добавлены.",
      uncategorizedTitle: "Без категории",
    },
    contact: {
      title: "Заказать рекламу",
      subtitle: "Свяжитесь с нами удобным способом",
      name: "Ваше имя",
      email: "Email",
      company: "Компания",
      message: "Сообщение",
      budget: "Бюджет",
      budgetOptions: ["до 100 000 руб.", "100 000 — 500 000 руб.", "500 000 — 1 000 000 руб.", "от 1 000 000 руб."],
      submit: "Отправить заявку",
      or: "или свяжитесь напрямую",
      telegram: "Написать в Telegram",
      emailUs: "Написать на Email",
      miniStats: {
        fastResponseValue: "< 1h",
        fastResponseLabel: "Время ответа",
        supportValue: "24/7",
        supportLabel: "Поддержка",
      },
    },
    footer: {
      rights: "Все права защищены",
      description: "Крупнейший игровой и киберспортивный медиахолдинг в Telegram",
      ctaTitle: "Давайте вместе сделаем что-то значимое?",
      privacy: "Политика конфиденциальности",
      dataPolicy: "Политика обработки данных",
    },
    blog: {
      title: "Блог",
      subtitle: "Новости, кейсы и материалы для партнёров",
      navLabel: "Блог",
      breadcrumbHome: "Главная",
      allCategories: "Все",
      readMore: "Читать далее",
      backToBlog: "Все записи",
      categoryLabel: "Категория",
      emptyAll: "Записей пока нет.",
      emptyCategory: "В этой категории пока нет записей.",
      dateLabel: "Дата",
    },
  },
  en: {
    nav: {
      about: "About",
      channels: "Channels",
      cases: "Cases",
      contacts: "Contacts",
      order: "Order Advertising",
    },
    hero: {
      title: "Rythm Group",
      subtitle: "The largest gaming, esports & media holding in Telegram",
      badge: "Telegram Media Holding",
      cta: "Order Advertising",
      scroll: "Learn More",
    },
    channels: {
      title: "Our Channels",
      subtitle: "Telegram channels by category with millions of subscribers",
      subscribers: "subscribers",
      reach: "reach",
    },
    about: {
      title: "Who We Are",
      subtitle: "A next-generation media holding",
      mission: {
        title: "Our Mission",
        text: "We unite the largest Telegram channels in the gaming and esports niche, creating a unified ecosystem for advertisers and audiences.",
      },
      team: {
        title: "Our Team",
        text: "Over 30 professionals in media, marketing, and content production work to develop the holding.",
      },
      audience: {
        title: "Target Audience",
        text: "Men aged 18-35, gamers, esports fans, tech enthusiasts, and active Telegram users.",
      },
    },
    stats: {
      title: "The Numbers Speak for Themselves",
      subtitle: "Results we have achieved",
      items: [
        { value: "50M+", label: "Subscribers" },
        { value: "120M+", label: "Monthly Reach" },
        { value: "80+", label: "Channels in Network" },
        { value: "500+", label: "Successful Ad Campaigns" },
      ],
    },
    cases: {
      title: "Who We Work With",
      subtitle: "Trusted by the biggest brands and companies",
      empty: "No partners added yet.",
      uncategorizedTitle: "Other Partners",
    },
    contact: {
      title: "Order Advertising",
      subtitle: "Get in touch with us in any convenient way",
      name: "Your Name",
      email: "Email",
      company: "Company",
      message: "Message",
      budget: "Budget",
      budgetOptions: ["up to $1,000", "$1,000 — $5,000", "$5,000 — $10,000", "$10,000+"],
      submit: "Submit Request",
      or: "or contact us directly",
      telegram: "Message on Telegram",
      emailUs: "Send an Email",
      miniStats: {
        fastResponseValue: "< 1h",
        fastResponseLabel: "Response Time",
        supportValue: "24/7",
        supportLabel: "Support",
      },
    },
    footer: {
      rights: "All rights reserved",
      description: "The largest gaming & esports media holding in Telegram",
      ctaTitle: "Shall we create something meaningful together?",
      privacy: "Privacy Policy",
      dataPolicy: "Data Processing Policy",
    },
    blog: {
      title: "Blog",
      subtitle: "News, case studies, and partner updates",
      navLabel: "Blog",
      breadcrumbHome: "Home",
      allCategories: "All",
      readMore: "Read more",
      backToBlog: "All posts",
      categoryLabel: "Category",
      emptyAll: "No posts yet.",
      emptyCategory: "No posts in this category yet.",
      dateLabel: "Date",
    },
  },
} as const

export type Translations = typeof fallbackTranslations.ru

// Export for backward compatibility
export const translations = fallbackTranslations
