import { createI18n } from 'vue-i18n'
import zh from './zh'
import th from './th'
import en from './en'

const saved = localStorage.getItem('lang') || 'zh'

const i18n = createI18n({
  legacy: false,
  locale: saved,
  fallbackLocale: 'zh',
  messages: { zh, th, en },
})

export default i18n

export function setLang(lang) {
  i18n.global.locale.value = lang
  localStorage.setItem('lang', lang)
}

export const statusLabels = (lang) => {
  const m = { zh, th, en }[lang] || zh
  return {
    1: m.status.pendingReview, 2: m.status.approved, 3: m.status.pendingPayment,
    4: m.status.paid, 5: m.status.warehouseReceiving, 6: m.status.inTransit,
    7: m.status.arrivedThailand, 8: m.status.inCustoms, 9: m.status.released,
    10: m.status.outForDelivery, 11: m.status.completed,
  }
}
