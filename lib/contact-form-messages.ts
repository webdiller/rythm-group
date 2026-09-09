import type { Locale } from "@/lib/i18n"

const MESSAGES = {
	ru: {
		generic: "Не удалось отправить сообщение. Попробуйте ещё раз или напишите нам напрямую.",
		invalidPayload: "Проверьте заполнение полей формы.",
		smtpNotConfigured: "Отправка временно недоступна: не настроена почта на сервере. Свяжитесь с нами через контакты ниже.",
		noRecipients: "Не указан email для приёма заявок. Свяжитесь с нами через контакты ниже.",
		network: "Ошибка сети. Проверьте подключение и попробуйте снова.",
		success: "Сообщение успешно отправлено.",
		sending: "Отправка...",
	},
	en: {
		generic: "Could not send your message. Please try again or contact us directly.",
		invalidPayload: "Please check the form fields.",
		smtpNotConfigured: "Sending is temporarily unavailable: mail is not configured on the server. Please use the contacts below.",
		noRecipients: "No recipient email is configured. Please use the contacts below.",
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
		case "SMTP is not configured":
			return getContactFormMessage(locale, "smtpNotConfigured")
		case "No recipient emails configured":
			return getContactFormMessage(locale, "noRecipients")
		case "Failed to send message":
			return getContactFormMessage(locale, "generic")
		default:
			return getContactFormMessage(locale, "generic")
	}
}
