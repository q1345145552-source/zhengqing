<template>
  <div class="history-list">
    <div class="page-header">
      <h2><el-icon><List /></el-icon> 已处理列表</h2>
    </div>

    <el-table :data="list" stripe v-loading="loading" empty-text="暂无已处理记录">
      <el-table-column label="申请编号" width="160">
        <template #default="{ row }">{{ row.application_no || '-' }}</template>
      </el-table-column>
      <el-table-column prop="client_name" label="客户" width="100" />
      <el-table-column prop="product_name" label="产品名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="审核结果" width="120">
        <template #default="{ row }">
          <el-tag :type="resultTag(row.review_status)" size="small">
            {{ resultLabel(row.review_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" width="170">
        <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
      </el-table-column>
      <el-table-column label="当前状态" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ statusLabel(row.review_status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/employee/review/${row.id}`)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSubmissions } from '@/api/employee'

const list = ref([])
const loading = ref(false)

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const res = await getSubmissions('processed')
    list.value = res.data || []
  } catch { /* handled */ }
  finally { loading.value = false }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

function resultTag(s) {
  return s === 'approved' || s === 'registered' ? 'success' : 'danger'
}

function resultLabel(s) {
  return s === 'approved' || s === 'registered' ? '审核通过' : '已退回'
}

function statusLabel(s) {
  return s === 'registered' ? '已注册' : s === 'approved' ? '待注册' : '已退回'
}
</script>

<style lang="scss" scoped>
.history-list { padding: 0; }
.page-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
  h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
}
</style>
