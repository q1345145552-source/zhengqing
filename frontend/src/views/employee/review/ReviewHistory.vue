<template>
  <div class="review-history">
    <div class="page-header">
      <h2><el-icon><Notebook /></el-icon> 审核记录</h2>
      <el-radio-group v-model="filter" size="small" @change="loadData">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="approve">审核通过</el-radio-button>
        <el-radio-button value="reject">已退回</el-radio-button>
        <el-radio-button value="register">已注册</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="list" stripe v-loading="loading" empty-text="暂无审核记录">
      <el-table-column label="申请编号" width="160">
        <template #default="{ row }">{{ row.application_no || '-' }}</template>
      </el-table-column>
      <el-table-column prop="client_name" label="客户" width="100" />
      <el-table-column prop="product_name" label="产品名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="审核结果" width="100">
        <template #default="{ row }">
          <el-tag :type="actionType(row.action)" size="small">{{ actionLabel(row.action) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="退回原因" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.action === 'reject' && row.comment" style="color:#F56C6C;font-size:13px">{{ row.comment }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/employee/review/${row.submission_id}`)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getReviewHistory } from '@/api/employee'

const list = ref([])
const loading = ref(false)
const filter = ref('all')

onMounted(() => loadData())
async function loadData() {
  loading.value = true
  try { const res = await getReviewHistory(filter.value); list.value = res.data || [] }
  catch { /* handled */ }
  finally { loading.value = false }
}

function actionType(a) {
  return a === 'approve' ? 'success' : a === 'reject' ? 'danger' : 'info'
}
function actionLabel(a) {
  return a === 'approve' ? '通过' : a === 'reject' ? '退回' : '注册'
}
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.review-history { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
</style>
