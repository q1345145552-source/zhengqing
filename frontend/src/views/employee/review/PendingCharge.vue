<template>
  <div class="pending-page">
    <h2><el-icon><WarningFilled /></el-icon> 待扣款确认</h2>
    <p class="page-desc">以下订单在推进到「已到泰国仓库」时扣款失败，等待客户充值后手动确认扣款</p>

    <div v-loading="loading" class="card-list">
      <el-empty v-if="list.length === 0" description="暂无待扣款申请" />

      <div v-for="item in list" :key="item.id" class="charge-card">
        <div class="card-body">
          <div class="card-header">
            <span class="app-no">{{ item.application_no || '#' + item.id }}</span>
            <el-tag type="danger" size="small" effect="dark">待扣款</el-tag>
          </div>
          <div class="card-info-row">
            <span><el-icon><User /></el-icon> {{ item.client_name }}</span>
          </div>
          <div class="card-numbers">
            <span class="card-number-item">应付 {{ (item.pending_charge_amount || 0).toLocaleString() }} ฿</span>
            <span class="card-number-item balance">余额 {{ (item.client_balance || 0).toLocaleString() }} ฿</span>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="success" :loading="retryingId === item.id" @click="handleRetry(item)">
            <el-icon><CircleCheckFilled /></el-icon> 确认扣款
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const loading = ref(false)
const retryingId = ref(null)

onMounted(loadList)

async function loadList() {
  loading.value = true
  try { const res = await request.get('/employee/pending-charges'); list.value = res.data || [] }
  catch { /* */ }
  finally { loading.value = false }
}

async function handleRetry(item) {
  try {
    await ElMessageBox.confirm(
      `确认从客户余额扣除 ${(item.pending_charge_amount || 0).toLocaleString()} ฿？当前余额 ${(item.client_balance || 0).toLocaleString()} ฿。`,
      '确认扣款', { confirmButtonText: '确认扣款', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  retryingId.value = item.id
  try {
    await request.post(`/employee/pending-charges/${item.id}/retry`)
    ElMessage.success('扣款成功，状态已推进')
    await loadList()
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '扣款失败')
  }
  finally { retryingId.value = null }
}
</script>

<style scoped>
.pending-page { max-width: 800px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 4px; }
.page-desc { color: #909399; font-size: 14px; margin: 0 0 20px; }
.card-list { display: flex; flex-direction: column; gap: 12px; }
.charge-card {
  background: #fff; border-radius: 10px; padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); display: flex; justify-content: space-between; align-items: center;
}
.card-body { flex: 1; }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.app-no { font-size: 19px; font-weight: 700; color: #303133; }
.card-info-row { font-size: 14px; color: #606266; margin-bottom: 6px; display: flex; align-items: center; gap: 4px; }
.card-numbers { display: flex; gap: 24px; }
.card-number-item { font-size: 17px; font-weight: 700; color: #F56C6C; }
.card-number-item.balance { font-size: 15px; font-weight: 600; color: #606266; }
</style>
