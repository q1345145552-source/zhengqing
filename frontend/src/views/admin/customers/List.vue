<template>
  <div class="customer-page">
    <div class="page-header"><h2><el-icon><UserFilled /></el-icon> 客户管理</h2></div>
    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="110" />
      <el-table-column label="姓名/公司" min-width="130"><template #default="{row}">{{ row.real_name || row.username }}</template></el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
      <el-table-column label="总申请数" width="90"><template #default="{row}">{{ row.total_submissions }}</template></el-table-column>
      <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.status==='active'?'success':'danger'" size="small">{{ row.status==='active'?'正常':'禁用' }}</el-tag></template></el-table-column>
      <el-table-column label="注册时间" width="160"><template #default="{row}">{{ format(row.created_at) }}</template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right"><template #default="{row}">
        <el-button size="small" @click="$router.push(`/admin/customers/${row.id}`)">详情</el-button>
        <el-popconfirm :title="row.status==='active'?'确认禁用？':'确认启用？'" @confirm="toggleStatus(row)">
          <template #reference><el-button size="small" :type="row.status==='active'?'danger':'success'">{{ row.status==='active'?'禁用':'启用' }}</el-button></template>
        </el-popconfirm>
      </template></el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const list = ref([]); const loading = ref(false)
onMounted(load)
async function load() { loading.value = true; try { const res = await request.get('/admin/customers'); list.value = res.data || [] } catch { /* */ } finally { loading.value = false } }
async function toggleStatus(row) {
  const ns = row.status === 'active' ? 'disabled' : 'active'
  try { await request.put(`/admin/customers/${row.id}/status`, { status: ns }); row.status = ns; ElMessage.success(ns === 'active' ? '已启用' : '已禁用') } catch { /* */ }
}
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.customer-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
</style>
