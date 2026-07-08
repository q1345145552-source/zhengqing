/**
 * 订单物流状态映射（支持多语言）
 */
import i18n from '@/locales'

const statusKeys = {
  1: 'pendingReview', 2: 'approved', 3: 'pendingPayment',
  4: 'paid', 5: 'warehouseReceiving', 6: 'inTransit',
  7: 'inCustoms', 8: 'released', 9: 'arrivedThailand',
  10: 'outForDelivery', 11: 'completed',
}

const colors = {
  1: '#E6A23C', 2: '#67C23A', 3: '#E6A23C', 4: '#67C23A',
  5: '#409EFF', 6: '#409EFF', 7: '#409EFF', 8: '#409EFF',
  9: '#67C23A', 10: '#409EFF', 11: '#909399',
}

const tagTypes = {
  1: 'warning', 2: 'success', 3: 'warning', 4: 'success',
  5: '', 6: '', 7: '', 8: '', 9: 'success', 10: '', 11: 'info',
}

export function getTrackingStatus(status) {
  const key = statusKeys[status]
  const label = key ? i18n.global.t(`status.${key}`) : '?'
  return { label, color: colors[status] || '#909399', tagType: tagTypes[status] || 'info' }
}

export function getNextStatusLabel(currentStatus) {
  if (currentStatus >= 11) return null
  const s = statusKeys[currentStatus + 1]
  return s ? i18n.global.t(`status.${s}`) : null
}

/** Reactive status map for v-for filter dropdowns */
export function getStatusOptions() {
  return Object.entries(statusKeys).map(([k, v]) => ({
    value: Number(k),
    label: i18n.global.t(`status.${v}`),
  }))
}
