<template>
  <div class="review-list">
    <div class="page-header">
      <h2><el-icon><DocumentChecked /></el-icon> 客户申请</h2>
      <el-radio-group v-model="filter" size="small" @change="loadList">
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

    <div v-loading="loading" class="card-list">
      <el-empty v-if="filteredList.length === 0" :description="$t('client.submissions.empty')" />

      <div v-for="item in filteredList" :key="item.id" class="submission-card">
        <div class="card-top">
          <div class="card-left">
            <span class="app-no"># {{ item.application_no || item.id }}</span>
            <el-tag :type="statusType(item)" size="small" effect="dark">
              {{ statusText(item) }}
            </el-tag>
            <el-tag v-if="item.tracking_status && item.tracking_status > 2" :color="trackingColor(item)" :type="trackingTagType(item)" size="small" effect="plain" style="margin-left:4px">
              {{ trackingLabel(item) }}
            </el-tag>
          </div>
          <div class="card-meta">
            <span class="client-name">{{ item.client_name }}</span>
            <span class="time">{{ formatDate(item.updated_at) }}</span>
          </div>
        </div>

        <div class="card-product">{{ item.product_name || '未填写产品信息' }}</div>

        <!-- 退回原因 -->
        <el-alert v-if="item.review_status === 'rejected' && item.review_comment" type="error" :closable="false" show-icon class="reject-alert">
          <template #title>退回原因: {{ item.review_comment }}</template>
        </el-alert>

        <div class="card-actions">
          <div class="card-info">
            <span v-if="item.review_status === 'registered' && item.next_account">
              <el-icon><Connection /></el-icon> {{ item.next_account }}
            </span>
          </div>
          <div class="card-btns">
            <el-button v-if="item.review_status === 'pending' || item.review_status === 'approved'" type="primary" size="small" @click="$router.push(`/employee/review/${item.id}`)">
              {{ item.review_status === 'approved' ? '录入注册' : '审核' }}
            </el-button>
            <el-button size="small" @click="$router.push(`/employee/review/${item.id}`)">查看详情</el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap">
      <el-pagination v-model:current-page="page" :page-size="pageSize" :page-sizes="[10,20,50]" :total="total" layout="total, sizes, prev, pager, next" small @size-change="onSizeChange" @current-change="loadList" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSubmissions } from '@/api/employee'
import { getTrackingStatus } from '@/utils/tracking'

const list = ref([])
const loading = ref(false)
const filter = ref('all')
const searchText = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filteredList = computed(() => list.value)

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const res = await getSubmissions(filter.value, { page: page.value, pageSize: pageSize.value, search: searchText.value })
    const d = res.data
    list.value = d.list || d || []
    total.value = d.total || 0
  } catch { /* handled */ }
  finally { loading.value = false }
}
function doSearch() { page.value = 1; loadList() }
function onSizeChange(s) { pageSize.value = s; page.value = 1; loadList() }

function statusType(item) {
  if (!item.review_status || item.review_status === 'pending') return 'warning'
  if (item.review_status === 'approved') return 'success'
  if (item.review_status === 'registered') return ''
  if (item.review_status === 'rejected') return 'danger'
  return 'info'
}
function statusText(item) {
  if (!item.review_status || item.review_status === 'pending') return '审核中'
  if (item.review_status === 'approved') return '审核通过'
  if (item.review_status === 'registered') return '已注册'
  if (item.review_status === 'rejected') return '已退回'
  return '-'
}
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
function trackingLabel(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).label : '' }
function trackingColor(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).color : '' }
function trackingTagType(item) { return item.tracking_status ? getTrackingStatus(item.tracking_status).tagType : '' }
</script>

<style lang="scss" scoped>
.review-list { max-width: 900px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
  h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0; } }
.card-list { display: flex; flex-direction: column; gap: 16px; }
.submission-card {
  background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-left { display: flex; align-items: center; gap: 12px; }
.app-no { font-size: 18px; font-weight: 700; color: #303133; }
.client-name { font-size: 14px; color: #606266; margin-right: 16px; }
.time { font-size: 12px; color: #c0c4cc; }
.card-product { font-size: 14px; color: #909399; margin-bottom: 14px; padding-left: 4px; }
.reject-alert { margin-bottom: 12px; }
.card-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
.card-info { font-size: 13px; color: #909399; display: flex; align-items: center; gap: 4px; }
</style>
