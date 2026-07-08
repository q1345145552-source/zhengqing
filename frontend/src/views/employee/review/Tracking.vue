<template>
  <div class="tracking-page">
    <div class="page-header">
      <h2><el-icon><Ship /></el-icon> 货物追踪</h2>
      <el-select v-model="statusFilter" :placeholder="$t('employee.tracking2.filterStatus')" clearable size="small" style="width:160px" @change="loadList">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
    </div>

    <div class="search-bar">
      <el-input v-model="searchText" :placeholder="$t('common.search')" clearable size="small" style="width:280px" @clear="doSearch" @keyup.enter="doSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" size="small" @click="doSearch">搜索</el-button>
    </div>

    <div v-loading="loading" class="card-list">
      <el-empty v-if="list.length === 0" :description="$t('employee.tracking2.empty')" />

      <div v-for="item in list" :key="item.id" class="track-card">
        <div class="card-body">
          <div class="card-header">
            <span class="app-no">{{ item.application_no || '订单 #' + item.id }}</span>
            <el-tag v-if="payBadge(item)" :type="payBadge(item).type" size="small" effect="dark">{{ payBadge(item).text }}</el-tag>
            <el-tag :color="statusInfo(item).color" :type="statusInfo(item).tagType" size="large" effect="dark">{{ statusInfo(item).label }}</el-tag>
          </div>
          <div class="card-info-row">
            <span v-if="item.company_name" class="card-company">{{ item.company_name }}</span>
            <span v-if="item.client_name" class="card-client"><el-icon><User /></el-icon>{{ item.client_name }}</span>
            <span class="card-product">{{ item.product_name }}</span>
          </div>
          <div class="card-numbers">
            <span v-if="item.tariff_rate" class="card-number-item">关税 {{ item.tariff_rate }}</span>
            <span class="card-number-item">运费 {{ (item.total_freight || 0).toLocaleString() }} ฿</span>
          </div>
          <div class="card-meta">
            <span v-if="item.client_tracking_number">运单号: {{ item.client_tracking_number }}</span>
            <span v-else style="color:#E6A23C">客户未填写运单号</span>
            <span style="margin-left:12px">更新于 {{ fmt(item.tracking_status_updated_at || item.updated_at) }}</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="primary" size="small" @click="$router.push(`/employee/review/${item.id}`)">
            <el-icon><View /></el-icon> 查看详情
          </el-button>
          <el-button v-if="canAdvance(item)" type="success" size="small" :loading="advancingId === item.id" @click="handleAdvance(item)">
            <el-icon><Right /></el-icon> 推进至「{{ nextLabel(item) }}」
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :page-sizes="[10,20,50]" :total="total" layout="total, sizes, prev, pager, next" small @size-change="onSizeChange" @current-change="loadList" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { advanceStatus } from '@/api/finance'
import { getTrackingStatus, getNextStatusLabel, getStatusOptions } from '@/utils/tracking'
import { ElMessage, ElMessageBox } from 'element-plus'

import { computed } from 'vue'
const statusOptions = computed(() => getStatusOptions())
const list = ref([])
const loading = ref(false)
const statusFilter = ref('')
const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const advancingId = ref(null)

onMounted(loadList)

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, search: searchText.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await request.get('/employee/tracking/list', { params })
    const d = res.data
    list.value = d.list || d || []
    total.value = d.total || 0
  } catch { /* */ }
  finally { loading.value = false }
}
function doSearch() { page.value = 1; loadList() }
function onSizeChange(s) { pageSize.value = s; page.value = 1; loadList() }

function statusInfo(item) { return getTrackingStatus(item.tracking_status) }
function payBadge(item) {
  const ts = item.tracking_status || 1
  if (item.pending_charge) return { text: '扣款失败待充值', type: 'danger' }
  if (ts < 7) return { text: '待付款', type: 'warning' }
  if (item.charge_status === 'charged') return { text: '已付款 ' + (item.charged_amount || 0).toLocaleString() + ' ฿', type: 'success' }
  return { text: '扣款失败', type: 'danger' }
}
function canAdvance(item) { const ts = item.tracking_status || 1; return ts >= 2 && ts < 9 }
function nextLabel(item) { return getNextStatusLabel(item.tracking_status) }

async function handleAdvance(item) {
  const next = (item.tracking_status || 1) + 1
  if (next === 7) {
    try {
      await ElMessageBox.confirm(
        '推进到「已到泰国仓库」将自动从客户余额扣款。请确保费用已确认且客户余额充足。',
        '确认到仓并扣款', { confirmButtonText: '确认推进并扣款', cancelButtonText: '取消', type: 'warning' }
      )
    } catch { return }
  }
  advancingId.value = item.id
  try { await advanceStatus(item.id); ElMessage.success('状态已推进'); await loadList() }
  catch (err) { ElMessage.error(err?.response?.data?.message || '操作失败') }
  finally { advancingId.value = null }
}

function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.tracking-page { max-width: 960px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.track-card { background: #fff; border-radius: 10px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,.06); display: flex; justify-content: space-between; align-items: center; }
.card-body { flex: 1; }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.app-no { font-size: 19px; font-weight: 700; color: #303133; letter-spacing: .5px; }
.card-info-row { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; flex-wrap: wrap; }
.card-company { font-size: 13px; font-weight: 600; color: #606266; }
.card-client { font-size: 13px; color: #909399; display: flex; align-items: center; gap: 3px; }
.card-product { font-size: 13px; color: #606266; }
.card-numbers { display: flex; gap: 20px; margin-top: 6px; }
.card-number-item { font-size: 15px; font-weight: 600; color: #E6A23C; }
.card-meta { font-size: 12px; color: #c0c4cc; margin-top: 4px; }
.card-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; margin-left: 16px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
