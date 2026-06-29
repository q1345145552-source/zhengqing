<template>
  <div class="tracking-page">
    <div class="page-header">
      <h2>货物追踪</h2>
      <el-select v-model="statusFilter" :placeholder="$t('employee.tracking2.filterStatus')" clearable size="small" style="width:160px" @change="doSearch">
        <el-option v-for="(v,k) in STATUS_MAP" :key="k" :label="v" :value="Number(k)" />
      </el-select>
    </div>

    <div class="search-bar">
      <el-input v-model="searchText" :placeholder="$t('common.search')" clearable size="small" style="width:280px" @clear="doSearch" @keyup.enter="doSearch"><template #prefix><el-icon><Search /></el-icon></template></el-input>
      <el-button type="primary" size="small" @click="doSearch">搜索</el-button>
    </div>

    <div v-loading="loading">
      <el-empty v-if="list.length === 0 && !loading" :description="$t('employee.tracking2.empty')" />
      <div v-for="item in list" :key="item.id" class="track-card" @click="$router.push(`/admin/submissions/${item.id}`)">
        <div class="card-body">
          <div class="card-header">
            <span class="app-no">{{ item.application_no || '#' + item.id }}</span>
            <el-tag v-if="payBadge(item)" :type="payBadge(item).type" size="small" effect="dark">{{ payBadge(item).text }}</el-tag>
            <el-tag :color="statusInfo(item).color" :type="statusInfo(item).tagType" size="large" effect="dark">{{ statusInfo(item).label }}</el-tag>
          </div>
          <div class="card-info">
            <span v-if="item.company_name" class="info-company">{{ item.company_name }}</span>
            <span class="info-client">{{ item.client_name }}</span>
            <span class="info-product">{{ item.product_name }}</span>
          </div>
          <div class="card-numbers">
            <span v-if="item.tariff_rate">关税 {{ item.tariff_rate }}</span>
            <span>运费 {{ (item.total_freight||0).toLocaleString() }} ฿</span>
          </div>
          <div class="card-time">更新于 {{ fmt(item.tracking_status_updated_at || item.updated_at) }}</div>
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
import { getTrackingStatus } from '@/utils/tracking'

const STATUS_MAP = { 1:'待审核',2:'审核通过',3:'待付款',4:'已付款',5:'中国仓库收货',6:'运输中',7:'已到泰国仓库',8:'清关中',9:'已放行',10:'已派送',11:'已完成' }

const list = ref([])
const loading = ref(false)
const statusFilter = ref('')
const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value, search: searchText.value }
    if (statusFilter.value) params.status = statusFilter.value
    const res = await request.get('/admin/tracking', { params })
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
  if (item.charge_status === 'charged') return { text: '已付款 '+ (item.charged_amount||0).toLocaleString()+' ฿', type: 'success' }
  return { text: '扣款失败', type: 'danger' }
}
function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.tracking-page { max-width: 960px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 22px; margin: 0; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.track-card { background: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer; transition: box-shadow .15s; }
.track-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }
.card-body { }
.card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.app-no { font-size: 17px; font-weight: 700; }
.card-info { display: flex; gap: 12px; font-size: 13px; color: #606266; margin-bottom: 4px; }
.info-company { font-weight: 600; }
.card-numbers { display: flex; gap: 16px; font-size: 14px; font-weight: 600; color: #E6A23C; margin-bottom: 2px; }
.card-time { font-size: 12px; color: #c0c4cc; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
