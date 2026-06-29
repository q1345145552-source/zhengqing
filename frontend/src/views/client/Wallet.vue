<template>
  <div class="wallet-page">
    <h2><el-icon><Coin /></el-icon> 我的钱包</h2>

    <!-- 余额卡片 -->
    <el-card class="balance-card" shadow="hover">
      <div class="balance-main">
        <span class="balance-label">当前余额</span>
        <span class="balance-value">¥ {{ balance }}</span>
      </div>
      <el-button type="warning" size="large" style="margin-top:16px" @click="showRecharge = true">
        充值
      </el-button>
    </el-card>

    <!-- 充值弹窗 -->
    <el-dialog v-model="showRecharge" title="账户充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="100" :step="100" :precision="2" style="width:100%" placeholder="请输入充值金额" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.description" placeholder="充值说明（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" :loading="recharging" @click="handleRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <!-- 交易记录 -->
    <el-card header="交易记录" style="margin-top:20px">
      <el-table :data="transactions" stripe v-loading="loading" empty-text="暂无交易记录">
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ format(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'deposit' ? '#67C23A' : '#F56C6C' }">
              {{ row.type === 'deposit' ? '+' : '-' }} ¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
        <el-table-column label="申请编号" width="150">
          <template #default="{ row }">{{ row.application_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="余额" width="120">
          <template #default="{ row }">¥{{ row.balance_after }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="total > 20"
        style="margin-top:16px;justify-content:flex-end"
        layout="prev,next"
        :total="total"
        :page-size="20"
        v-model:current-page="page"
        @current-change="loadTransactions"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWallet, getTransactions, clientDeposit } from '@/api/finance'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const balance = ref(0)
const transactions = ref([])
const loading = ref(false)
const page = ref(1)
const total = ref(0)
const showRecharge = ref(false)
const recharging = ref(false)
const rechargeForm = ref({ amount: 1000, description: '' })

onMounted(async () => {
  try { const w = await getWallet(); balance.value = w.data.balance }
  catch { /* ignore */ }
  loadTransactions()
})

async function handleRecharge() {
  if (!rechargeForm.value.amount || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请输入充值金额')
    return
  }
  recharging.value = true
  try {
    await clientDeposit(rechargeForm.value.amount, rechargeForm.value.description || '在线充值')
    ElMessage.success('充值申请已提交，等待员工审核')
    showRecharge.value = false
    rechargeForm.value = { amount: 1000, description: '' }
  } catch { /* handled */ }
  finally { recharging.value = false }
}

async function loadTransactions() {
  loading.value = true
  try { const res = await getTransactions(page.value); transactions.value = res.data.list; total.value = res.data.total }
  catch { /* ignore */ }
  finally { loading.value = false }
}

function typeTag(t) { return t === 'deposit' ? 'success' : t === 'refund' ? 'warning' : 'danger' }
function typeLabel(t) { return t === 'deposit' ? '充值' : t === 'refund' ? '退款' : '扣费' }
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.wallet-page { max-width: 900px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
.balance-card { text-align: center; padding: 20px; background: linear-gradient(135deg, #409EFF, #337ECC); color: #fff; border: none; }
.balance-main { display: flex; flex-direction: column; gap: 8px; }
.balance-label { font-size: 14px; opacity: .8; }
.balance-value { font-size: 40px; font-weight: 700; }
</style>
