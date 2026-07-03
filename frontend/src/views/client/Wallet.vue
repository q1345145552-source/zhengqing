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

    <!-- 收款银行账户 -->
    <el-card header="收款银行账户" shadow="hover" style="margin-top:20px">
      <template #header>
        <div style="display:flex;align-items:center;gap:8px">
          <el-icon color="#409EFF"><Bank /></el-icon>
          <span>公司收款账户（泰国公户）</span>
          <el-tag type="warning" size="small">仅接收清关公司抬头转账</el-tag>
        </div>
      </template>
      <el-descriptions :column="2" border size="large">
        <el-descriptions-item label="银行名称" label-align="right">
          <strong>กรุงไทย (Krungthai Bank)</strong>
        </el-descriptions-item>
        <el-descriptions-item label="账户名称" label-align="right">
          <strong>XT Logistics Co., Ltd.</strong>
        </el-descriptions-item>
        <el-descriptions-item label="账号" label-align="right">
          <strong style="font-size:16px;color:#409EFF">123-4-56789-0</strong>
        </el-descriptions-item>
        <el-descriptions-item label="SWIFT" label-align="right">
          <strong>KRTHTHBK</strong>
        </el-descriptions-item>
        <el-descriptions-item label="银行地址" label-align="right" :span="2">
          123 Ratchadaphisek Road, Bangkok 10400, Thailand
        </el-descriptions-item>
      </el-descriptions>
      <div style="margin-top:12px;padding:10px;background:#fdf6ec;border-radius:6px;color:#E6A23C;font-size:13px">
        <el-icon><WarningFilled /></el-icon>
        请使用需要清关的公司抬头转账。转账时请备注您的用户名，并上传水单。只接受需要清关抬头的公司转账，其他抬头式的转账不接受。
      </div>
    </el-card>

    <!-- 充值弹窗 -->
    <el-dialog v-model="showRecharge" title="账户充值" width="480px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="100" :step="100" :precision="2" style="width:100%" placeholder="请输入充值金额" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.description" placeholder="充值说明（选填）" />
        </el-form-item>
        <el-form-item label="支付水单">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :on-change="handleSlipChange"
            :on-remove="handleSlipRemove"
            :file-list="slipFileList"
            accept="image/*,.pdf"
            list-type="picture"
          >
            <el-button type="primary" :disabled="slipFileList.length >= 1">
              选择水单图片
            </el-button>
            <template #tip>
              <div class="el-upload__tip">上传转账凭证，支持图片或PDF</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRecharge = false">取消</el-button>
        <el-button type="primary" :loading="recharging" @click="handleRecharge">提交充值申请</el-button>
      </template>
    </el-dialog>

    <!-- 充值申请记录 -->
    <el-card header="充值申请记录" style="margin-top:20px">
      <el-table :data="depositRequests" stripe v-loading="reqLoading" empty-text="暂无充值申请">
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">+ {{ row.amount }} ฿</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="reqStatusTag(row.status)" size="small">{{ reqStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核备注" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.review_comment || '-' }}</template>
        </el-table-column>
        <el-table-column label="水单" width="80">
          <template #default="{ row }">
            <el-button v-if="row.payment_slip" type="primary" link size="small" @click="previewSlip(row.payment_slip)">查看</el-button>
            <span v-else style="color:#C0C4CC">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 交易记录 -->
    <el-card header="交易记录" style="margin-top:20px">
      <el-table :data="transactions" stripe v-loading="loading" empty-text="暂无交易记录">
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ typeLabel(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'deposit' || row.type === 'refund' ? '#67C23A' : '#F56C6C' }">
              {{ row.type === 'deposit' || row.type === 'refund' ? '+' : '-' }} ¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">{{ row.operated_by_name || '-' }}</template>
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

    <!-- 扣款记录 -->
    <el-card header="扣款记录" style="margin-top:20px">
      <el-table :data="chargeHistory" stripe empty-text="暂无扣款记录">
        <el-table-column label="扣款时间" width="170">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="申请编号" width="140">
          <template #default="{ row }">{{ row.application_no || '-' }}</template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">- ¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 水单预览弹窗 -->
    <el-dialog v-model="showSlip" title="支付水单" width="600px">
      <img v-if="slipUrl && !slipUrl.toLowerCase().endsWith('.pdf')" :src="slipUrl" style="width:100%;max-height:70vh;object-fit:contain" />
      <div v-else style="text-align:center;padding:40px">
        <el-link :href="slipUrl" target="_blank" type="primary" :underline="false">
          <el-icon :size="60"><Document /></el-icon>
          <div style="margin-top:12px">点击查看PDF文件</div>
        </el-link>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getWallet, getTransactions, getClientDepositRequests } from '@/api/finance'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const balance = ref(0)
const transactions = ref([])
const depositRequests = ref([])
const loading = ref(false)
const reqLoading = ref(false)
const page = ref(1)
const total = ref(0)
const showRecharge = ref(false)
const recharging = ref(false)
const rechargeForm = ref({ amount: 1000, description: '' })
const slipFileList = ref([])
const slipFile = ref(null)
const showSlip = ref(false)
const slipUrl = ref('')
const chargeHistory = ref([])

onMounted(async () => {
  try { const w = await getWallet(); balance.value = w.data.balance } catch { /* */ }
  loadTransactions()
  loadDepositRequests()
  loadChargeHistory()
})

async function loadChargeHistory() {
  try {
    const res = await request.get('/finance/client/charge-history')
    chargeHistory.value = res.data || []
  } catch { chargeHistory.value = [] }
}

function handleSlipChange(file) {
  slipFile.value = file.raw
  slipFileList.value = [file]
}

function handleSlipRemove() {
  slipFile.value = null
  slipFileList.value = []
}

async function handleRecharge() {
  if (!rechargeForm.value.amount || rechargeForm.value.amount <= 0) {
    ElMessage.warning('请输入充值金额')
    return
  }
  recharging.value = true
  try {
    const formData = new FormData()
    formData.append('amount', String(rechargeForm.value.amount))
    formData.append('description', rechargeForm.value.description || '在线充值')
    if (slipFile.value) {
      formData.append('slip', slipFile.value)
    }
    await request.post('/finance/client/deposit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    ElMessage.success('充值申请已提交，等待员工审核')
    showRecharge.value = false
    rechargeForm.value = { amount: 1000, description: '' }
    slipFile.value = null
    slipFileList.value = []
    loadDepositRequests()
  } catch { /* handled */ }
  finally { recharging.value = false }
}

async function loadDepositRequests() {
  reqLoading.value = true
  try {
    const res = await getClientDepositRequests()
    depositRequests.value = res.data.list || []
  } catch { /* */ }
  finally { reqLoading.value = false }
}

async function loadTransactions() {
  loading.value = true
  try {
    const res = await getTransactions(page.value)
    transactions.value = res.data.list
    total.value = res.data.total
  } catch { /* */ }
  finally { loading.value = false }
}

function previewSlip(path) {
  slipUrl.value = path
  showSlip.value = true
}

function typeTag(t) { return t === 'deposit' ? 'success' : t === 'refund' ? 'warning' : 'danger' }
function typeLabel(t) { return t === 'deposit' ? '充值到账' : t === 'refund' ? '退款' : '扣费' }
function reqStatusTag(s) { return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
function reqStatusLabel(s) { return s === 'approved' ? '已通过' : s === 'rejected' ? '已拒绝' : '待审核' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.wallet-page { max-width: 900px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
.balance-card { text-align: center; padding: 20px; background: linear-gradient(135deg, #409EFF, #337ECC); color: #fff; border: none; }
.balance-main { display: flex; flex-direction: column; gap: 8px; }
.balance-label { font-size: 14px; opacity: .8; }
.balance-value { font-size: 40px; font-weight: 700; }
</style>
