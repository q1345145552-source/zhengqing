<template>
  <div class="charge-history-page">
    <div class="page-header">
      <h2><el-icon><Money /></el-icon> 扣款记录</h2>
    </div>

    <el-table :data="records" stripe v-loading="loading" empty-text="暂无扣款记录">
      <el-table-column label="客户" width="120">
        <template #default="{ row }">{{ row.client_name || '-' }}</template>
      </el-table-column>
      <el-table-column label="申请编号" width="150">
        <template #default="{ row }">{{ row.application_no || '-' }}</template>
      </el-table-column>
      <el-table-column label="扣款金额" width="120">
        <template #default="{ row }">- ¥{{ row.amount }}</template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
      <el-table-column label="扣款时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作员工" width="120">
        <template #default="{ row }">{{ row.operated_by_name || '-' }}</template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const loading = ref(false)
const records = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/employee/charge-history')
    records.value = res.data || []
  } catch { /* */ }
  finally { loading.value = false }
})

function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.charge-history-page { max-width: 1100px; margin: 0 auto; }
.page-header { margin-bottom: 20px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
</style>
