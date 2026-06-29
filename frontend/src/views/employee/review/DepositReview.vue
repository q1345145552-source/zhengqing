<template>
  <div class="deposit-review-page">
    <h2><el-icon><Money /></el-icon> 充值审核</h2>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已处理" name="processed" />
    </el-tabs>

    <el-table :data="list" stripe v-loading="loading" empty-text="暂无充值申请">
      <el-table-column label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column prop="username" label="客户" width="120" />
      <el-table-column label="金额" width="120">
        <template #default="{ row }">
          <span style="color: #67C23A; font-weight: 700">+ {{ row.amount }} ฿</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="120" show-overflow-tooltip />
      <el-table-column label="水单" width="90">
        <template #default="{ row }">
          <el-button v-if="row.payment_slip" type="primary" link size="small" @click="previewSlip(row.payment_slip)">查看水单</el-button>
          <span v-else style="color:#C0C4CC">未上传</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="activeTab === 'processed'" label="审核备注" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ row.review_comment || '-' }}</template>
      </el-table-column>
      <el-table-column v-if="activeTab === 'pending'" label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="success" size="small" @click="handleReview(row, 'approve')">通过</el-button>
          <el-button type="danger" size="small" @click="handleReview(row, 'reject')">拒绝</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      style="margin-top:16px;justify-content:flex-end"
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="page"
      @current-change="loadData"
    />

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="showReject" title="拒绝原因" width="400px">
      <el-input v-model="rejectComment" type="textarea" :rows="3" placeholder="请输入拒绝原因（选填）" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 水单预览弹窗 -->
    <el-dialog v-model="showSlipPreview" title="支付水单" width="600px">
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
import { getDepositRequests, reviewDepositRequest } from '@/api/finance'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('pending')
const list = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showReject = ref(false)
const reviewing = ref(false)
const rejectComment = ref('')
const currentRow = ref(null)
const showSlipPreview = ref(false)
const slipUrl = ref('')

onMounted(() => { loadData() })

function handleTabChange() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    const filter = activeTab.value === 'pending' ? 'pending' : 'processed'
    const res = await getDepositRequests(filter, page.value, pageSize.value)
    list.value = res.data.list
    total.value = res.data.total
  } catch { /* handled */ }
  finally { loading.value = false }
}

function handleReview(row, action) {
  currentRow.value = row
  if (action === 'reject') {
    rejectComment.value = ''
    showReject.value = true
    return
  }
  ElMessageBox.confirm(
    '确认通过客户 ' + row.username + ' 的充值申请（金额：' + row.amount + ' ฿）？',
    '审核确认',
    { confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'success' }
  ).then(async () => {
    reviewing.value = true
    try {
      await reviewDepositRequest(row.id, 'approve')
      ElMessage.success('已通过，余额已到账')
      loadData()
    } catch { /* */ }
    finally { reviewing.value = false }
  }).catch(() => {})
}

async function confirmReject() {
  reviewing.value = true
  try {
    await reviewDepositRequest(currentRow.value.id, 'reject', rejectComment.value)
    ElMessage.success('已拒绝')
    showReject.value = false
    loadData()
  } catch { /* */ }
  finally { reviewing.value = false }
}

function previewSlip(path) { slipUrl.value = path; showSlipPreview.value = true }
function statusTag(s) { return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
function statusLabel(s) { return s === 'approved' ? '已通过' : s === 'rejected' ? '已拒绝' : '待审核' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.deposit-review-page { max-width: 1100px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
</style>
