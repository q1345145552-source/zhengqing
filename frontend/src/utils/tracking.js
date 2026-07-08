/**
 * 订单物流状态映射（支持多语言）
 */
import i18n from '@/locales'

const statusKeys = {
  1: 'pendingReview', 2: 'approved', 3: 'warehouseReceiving',
  4: 'inTransit', 5: 'inCustoms', 6: 'released',
  7: 'arrivedThailand', 8: 'outForDelivery', 9: 'completed',
}

const colors = {
  1: '#E6A23C', 2: '#67C23A', 3: '#409EFF', 4: '#409EFF',
  5: '#409EFF', 6: '#409EFF', 7: '#67C23A', 8: '#409EFF', 9: '#909399',
}

const tagTypes = {
  1: 'warning', 2: 'success', 3: '', 4: '', 5: '',
  6: '', 7: 'success', 8: '', 9: 'info',
}

export function getTrackingStatus(status) {
  const key = statusKeys[status]
  const label = key ? i18n.global.t(`status.${key}`) : '?'
  return { label, color: colors[status] || '#909399', tagType: tagTypes[status] || 'info' }
}

export function getNextStatusLabel(currentStatus) {
  if (currentStatus >= 9) return null
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
