<template>
  <div class="tracking-page">
    <h2><el-icon><Ship /></el-icon> {{ t('nav.cargoTracking') }}</h2>
    <div class="search-bar">
      <el-input v-model="searchText" :placeholder="t('common.search')" clearable size="small" style="width:320px" @clear="doSearch" @keyup.enter="doSearch"><template #prefix><el-icon><Search /></el-icon></template></el-input>
      <el-button type="primary" size="small" @click="doSearch">{{ t('common.search') }}</el-button>
    </div>
    <div v-loading="loading" class="card-list">
      <el-empty v-if="list.length === 0 && !loading" :description="t('client.tracking.empty')"><el-button type="primary" @click="$router.push('/client/upload')">去上传资料</el-button></el-empty>
      <div v-for="item in list" :key="item.id" class="track-card" @click="$router.push(`/client/tracking/${item.id}`)">
        <div class="card-body">
          <div class="card-header">
            <span class="app-no">{{ item.application_no || '订单 #' + item.id }}</span>
            <el-tag v-if="payBadge(item)" :type="payBadge(item).type" size="small" effect="dark">{{ payBadge(item).text }}</el-tag>
            <el-tag :color="statusInfo(item).color" :type="statusInfo(item).tagType" size="large" effect="dark">{{ statusInfo(item).label }}</el-tag>
          </div>
          <div class="card-info-row">
            <span v-if="item.company_name" class="card-company">{{ item.company_name }}</span>
            <span class="card-product">{{ item.product_name }}</span>
          </div>
          <div class="card-numbers">
            <span v-if="item.tariff_rate" class="card-number-item">{{ t('order.tariff') }} {{ item.tariff_rate }}</span>
            <span class="card-number-item">{{ t('order.freight') }} {{ (item.total_freight || 0).toLocaleString() }} ฿</span>
          </div>
          <div class="card-meta"><span>{{ t('order.updatedAt') }} {{ fmt(item.tracking_status_updated_at || item.updated_at) }}</span></div>
        </div>
        <el-icon :size="18" color="#c0c4cc"><ArrowRight /></el-icon>
      </div>
    </div>
    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :page-sizes="[10,20,50]" :total="total" layout="total, sizes, prev, pager, next" small @size-change="onSizeChange" @current-change="loadList" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import request from '@/api/request'
import { getTrackingStatus } from '@/utils/tracking'

const { t } = useI18n()
const list = ref([])
const loading = ref(false)
const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(loadList)

async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/finance/client/tracking', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    const d = res.data; list.value = d.list || d || []; total.value = d.total || 0
  } catch { /* */ }
  finally { loading.value = false }
}
function doSearch() { page.value = 1; loadList() }
function onSizeChange(s) { pageSize.value = s; page.value = 1; loadList() }
function statusInfo(item) { return getTrackingStatus(item.tracking_status) }
function payBadge(item) {
  const ts = item.tracking_status || 1
  if (item.pending_charge) return { text: t('payment.pendingRetry'), type: 'danger' }
  if (ts < 7) return { text: t('payment.pending'), type: 'warning' }
  if (item.charge_status === 'charged') return { text: t('payment.paid') + ' ' + (item.charged_amount || 0).toLocaleString() + ' ฿', type: 'success' }
  return { text: t('payment.failed'), type: 'danger' }
}
function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.tracking-page { max-width: 800px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 16px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.track-card { background: #fff; border-radius: 10px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: transform .15s, box-shadow .15s; &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.1); } }
.card-body { flex: 1; }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.app-no { font-size: 19px; font-weight: 700; color: #303133; }
.card-info-row { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
.card-company { font-size: 13px; font-weight: 600; color: #606266; }
.card-product { font-size: 13px; color: #606266; }
.card-numbers { display: flex; gap: 20px; margin-top: 6px; }
.card-number-item { font-size: 15px; font-weight: 600; color: #E6A23C; }
.card-meta { font-size: 12px; color: #c0c4cc; margin-top: 4px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
