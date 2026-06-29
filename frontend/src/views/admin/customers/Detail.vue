<template>
  <div class="customer-detail" v-loading="loading">
    <el-button text @click="$router.push('/admin/customers')"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
    <h2 style="margin:12px 0">{{ data.username || '-' }} 的详情</h2>
    <el-descriptions :column="3" border size="small">
      <el-descriptions-item label="用户名">{{ data.username }}</el-descriptions-item>
      <el-descriptions-item label="姓名/公司">{{ data.real_name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="邮箱">{{ data.email || '-' }}</el-descriptions-item>
      <el-descriptions-item label="钱包余额">฿{{ data.wallet_balance }}</el-descriptions-item>
      <el-descriptions-item label="总申请数">{{ data.submissions?.length || 0 }}</el-descriptions-item>
      <el-descriptions-item label="状态"><el-tag :type="data.status==='active'?'success':'danger'" size="small">{{ data.status==='active'?'正常':'禁用' }}</el-tag></el-descriptions-item>
    </el-descriptions>

    <el-tabs v-model="tab" style="margin-top:20px">
      <el-tab-pane label="走货记录" name="subs">
        <el-table :data="data.submissions || []" size="small" stripe>
          <el-table-column label="申请编号" width="150"><template #default="{row}">{{ row.application_no || '-' }}</template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{row}"><el-tag size="small">{{ statusLabel(row.review_status) }}</el-tag></template></el-table-column>
          <el-table-column label="提交时间" width="160"><template #default="{row}">{{ format(row.created_at) }}</template></el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="财务记录" name="txs">
        <el-table :data="data.transactions || []" size="small" stripe>
          <el-table-column label="类型" width="80"><template #default="{row}"><el-tag :type="row.type==='deposit'?'success':row.type==='refund'?'warning':'danger'" size="small">{{ row.type==='deposit'?'充值':row.type==='refund'?'退款':'扣费' }}</el-tag></template></el-table-column>
          <el-table-column label="金额" width="120"><template #default="{row}">฿{{ row.amount }}</template></el-table-column>
          <el-table-column label="操作人" width="100"><template #default="{row}">{{ row.operated_by_name || '-' }}</template></el-table-column>
          <el-table-column label="时间" width="160"><template #default="{row}">{{ format(row.created_at) }}</template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'

const route = useRoute(); const loading = ref(false); const tab = ref('subs')
const data = reactive({ submissions: [], transactions: [] })

onMounted(async () => { loading.value = true; try { const res = await request.get(`/admin/customers/${route.params.id}`); Object.assign(data, res.data) } catch { /* */ } finally { loading.value = false } })
function statusLabel(s) { return s==='pending'?'审核中':s==='approved'?'已通过':s==='registered'?'已注册':s==='rejected'?'已退回':'-' }
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.customer-detail { max-width: 1000px; margin: 0 auto; }
</style>
