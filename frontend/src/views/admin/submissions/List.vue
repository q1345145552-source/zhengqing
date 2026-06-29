<template>
  <div class="admin-list">
    <div class="page-header">
      <h2>所有申请</h2>
      <el-radio-group v-model="filter" size="small" @change="doSearch">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">审核中</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="registered">已注册</el-radio-button>
        <el-radio-button value="rejected">已退回</el-radio-button>
      </el-radio-group>
    </div>

    <div class="search-bar">
      <el-input v-model="searchText" :placeholder="$t('common.search')" clearable size="small" style="width:280px" @clear="doSearch" @keyup.enter="doSearch">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-button type="primary" size="small" @click="doSearch">搜索</el-button>
    </div>

    <div v-loading="loading">
      <el-empty v-if="list.length === 0 && !loading" :description="$t('client.submissions.empty')" />
      <div v-for="item in list" :key="item.id" class="submission-card" @click="$router.push(`/admin/submissions/${item.id}`)">
        <div class="card-top">
          <span class="app-no">{{ item.application_no || '#' + item.id }}</span>
          <el-tag :type="statusType(item)" size="small" effect="dark">{{ statusText(item) }}</el-tag>
          <el-tag v-if="item.tracking_status && item.tracking_status > 2" :color="trackingColor(item)" :type="trackingTagType(item)" size="small" effect="plain">{{ trackingLabel(item) }}</el-tag>
          <div class="card-right">
            <span class="client">{{ item.client_name }}</span>
            <span class="time">{{ formatDate(item.updated_at) }}</span>
          </div>
        </div>
        <div class="card-mid">{{ item.product_name || '未填写产品信息' }}</div>
        <el-alert v-if="item.review_status === 'rejected' && item.review_comment" type="error" :closable="false" show-icon class="reject-alert" :title="'退回原因: '+item.review_comment" />
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

const list = ref([])
const loading = ref(false)
const filter = ref('all')
const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const res = await request.get('/admin/submissions', { params: { filter: filter.value, page: page.value, pageSize: pageSize.value, search: searchText.value } })
    const d = res.data
    list.value = d.list || d || []
    total.value = d.total || 0
  } catch { /* */ }
  finally { loading.value = false }
}
function doSearch() { page.value = 1; loadList() }
function onSizeChange(s) { pageSize.value = s; page.value = 1; loadList() }

function statusType(item) {
  const s = item.review_status
  if (!s || s === 'pending') return 'warning'
  if (s === 'approved') return 'success'
  if (s === 'registered') return ''
  if (s === 'rejected') return 'danger'
  return 'info'
}
function statusText(item) {
  const s = item.review_status
  if (!s || s === 'pending') return '审核中'
  if (s === 'approved') return '审核通过'
  if (s === 'registered') return '已注册'
  if (s === 'rejected') return '已退回'
  return '-'
}
function trackingLabel(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).label : '' }
function trackingColor(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).color : '' }
function trackingTagType(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).tagType : '' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.admin-list { max-width: 960px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { font-size: 22px; margin: 0; }
.search-bar { display: flex; gap: 8px; margin-bottom: 16px; }
.submission-card { background: #fff; border-radius: 10px; padding: 16px 20px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer; transition: box-shadow .15s; }
.submission-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,.12); }
.card-top { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.app-no { font-size: 17px; font-weight: 700; color: #303133; }
.card-right { margin-left: auto; display: flex; gap: 12px; align-items: center; }
.client { font-size: 13px; color: #606266; }
.time { font-size: 12px; color: #c0c4cc; }
.card-mid { font-size: 13px; color: #909399; padding-left: 2px; }
.reject-alert { margin-top: 8px; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 20px; }
</style>
