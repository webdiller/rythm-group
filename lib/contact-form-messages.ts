import type { Locale } from "@/lib/i18n"

const MESSAGES = {
  ru: {
    generic: "Не удалось отправить сообщение. Попробуйте ещё раз или напишите нам напрямую.",
    invalidPayload: "Проверьте заполнение полей формы.",
    telegramNotConfigured:
      "Отправка временно недоступна: Telegram не настроен на сервере. Свяжитесь с нами через контакты ниже.",
    rateLimit:
      "Слишком много заявок. Можно отправить не более 6 сообщений в минуту. Подождите немного и попробуйте снова.",
    network: "Ошибка сети. Проверьте подключение и попробуйте снова.",
    success: "Сообщение успешно отправлено.",
    sending: "Отправка...",
  },
  en: {
    generic: "Could not send your message. Please try again or contact us directly.",
    invalidPayload: "Please check the form fields.",
    telegramNotConfigured:
      "Sending is temporarily unavailable: Telegram is not configured on the server. Please use the contacts below.",
    rateLimit: "Too many requests. You can send at most 6 messages per minute. Please wait and try again.",
    network: "Network error. Check your connection and try again.",
    success: "Message sent successfully.",
    sending: "Sending...",
  },
} as const

export function getContactFormMessage(locale: Locale, key: keyof (typeof MESSAGES)["ru"]): string {
  return MESSAGES[locale][key]
}

export function mapContactApiError(error: string | undefined, locale: Locale): string {
  switch (error) {
    case "Invalid payload":
      return getContactFormMessage(locale, "invalidPayload")
    case "Telegram is not configured":
      return getContactFormMessage(locale, "telegramNotConfigured")
    case "Rate limit exceeded":
      return getContactFormMessage(locale, "rateLimit")
    case "Failed to send message":
      return getContactFormMessage(locale, "generic")
    default:
      return getContactFormMessage(locale, "generic")
  }
}
