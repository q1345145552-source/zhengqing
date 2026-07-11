<template>
  <div class="client-page my-submissions">
    <div class="page-header">
      <h2><el-icon><Document /></el-icon> 我的申请</h2>
      <el-radio-group v-model="filter" size="small" @change="loadList">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">审核中</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="registered">已注册</el-radio-button>
        <el-radio-button value="rejected">已退回</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 申请卡片列表 -->
    <div v-loading="loading" class="card-list">
      <el-empty v-if="!loading && filteredList.length === 0" description="暂无申请记录">
        <el-button type="primary" @click="$router.push('/client/upload')">去提交申请</el-button>
      </el-empty>

      <div v-for="item in filteredList" :key="item.id" class="submission-card" @click="goDetail(item)">
        <!-- 卡片头部 -->
        <div class="card-top">
          <div class="card-left">
            <span class="app-no"># {{ item.application_no || '草稿' }}</span>
            <el-tag :type="statusType(item)" size="small" effect="dark">
              {{ statusText(item) }}
            </el-tag>
          </div>
          <span class="card-time">{{ formatDate(item.updated_at) }}</span>
        </div>

        <!-- 退回原因 -->
        <el-alert
          v-if="item.review_status === 'rejected'"
          type="error" :closable="false" show-icon class="reject-alert"
        >
          <template #title>退回原因: {{ item.review_comment }}</template>
        </el-alert>

        <!-- 底部操作 -->
        <div class="card-actions">
          <div class="card-meta">
            <span v-if="item.review_status === 'registered' && item.next_account">
              <el-icon><Connection /></el-icon> {{ item.next_account }}
            </span>
          </div>
          <div class="card-btns" @click.stop>
            <el-button
              v-if="item.review_status === 'rejected'"
              type="warning" size="small" @click="handleResubmit(item)"
            >
              修改并重新提交
            </el-button>
            <el-button size="small" @click="goDetail(item)">
              查看详情
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadList"
      style="margin-top:16px;justify-content:center"
    />

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" title="申请详情" width="720px" :close-on-click-modal="false">
      <template v-if="detailData">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="申请编号">{{ detailData.application_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(detailData.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="statusType(detailData)" size="small">{{ statusText(detailData) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(detailData.updated_at) }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData.review_status === 'rejected'" label="退回原因" :span="2">
            <span style="color:#F56C6C">{{ detailData.review_comment }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="detailData.next_account" label="Next 账号">{{ detailData.next_account }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData.next_register_status" label="注册状态">{{ detailData.next_register_status }}</el-descriptions-item>
          <el-descriptions-item label="费用状态" :span="2">
            <el-tag v-if="chargeLog?.status === 'charged'" type="success" size="small">已扣款（{{ formatDate(chargeLog.charged_at) }}）</el-tag>
            <el-tag v-else-if="chargeLog?.status === 'refunded'" type="warning" size="small">已退款（{{ formatDate(chargeLog.refunded_at) }}）</el-tag>
            <el-tag v-else-if="chargeItems.length > 0" type="info" size="small">待扣款（货物到仓后自动扣款）</el-tag>
            <span v-else style="color:#c0c4cc">费用待核算</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 费用明细 -->
        <div v-if="chargeItems.length > 0" style="margin-top:16px">
          <el-divider content-position="left">费用明细（泰铢）</el-divider>
          <el-table :data="chargeItems" size="small" border>
            <el-table-column prop="fee_name" label="项目" />
            <el-table-column label="数量" width="80"><template #default="{row}">{{ row.quantity }}</template></el-table-column>
            <el-table-column label="单价" width="100"><template #default="{row}">฿{{ row.unit_price }}</template></el-table-column>
            <el-table-column label="金额" width="110">
              <template #default="{row}"><span :style="{color:row.selected?'#303133':'#c0c4cc'}">฿{{ row.amount }}</span></template>
            </el-table-column>
            <el-table-column label="备注" width="80"><template #default="{row}">{{ row.is_optional ? (row.selected ? '已勾选' : '未选') : '必收' }}</template></el-table-column>
          </el-table>
          <div style="text-align:right;margin-top:12px;font-size:16px;font-weight:700">
            合计: ฿{{ chargeTotal }}
            <el-tag v-if="chargeLog?.status === 'charged'" type="success" size="small" style="margin-left:8px">已扣款</el-tag>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button v-if="detailData?.review_status === 'rejected'" type="warning" @click="handleResubmit(detailData); showDetail = false">
          修改并重新提交
        </el-button>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMySubmissions, getSubmission, resubmitSubmission } from '@/api/submission'
import { getClientCharges } from '@/api/finance'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const list = ref([])
const loading = ref(false)
const filter = ref('all')
const showDetail = ref(false)
const detailData = ref(null)
const chargeItems = ref([])
const chargeTotal = ref(0)
const chargeLog = ref(null)
const page = ref(1)
const total = ref(0)
const pageSize = ref(10)

const filteredList = computed(() => {
  if (filter.value === 'all') return list.value
  if (filter.value === 'pending') return list.value.filter(i => !i.review_status || i.review_status === 'pending')
  return list.value.filter(i => i.review_status === filter.value)
})

onMounted(() => loadList())

async function loadList() {
  loading.value = true
  try {
    const res = await getMySubmissions({ page: page.value, pageSize: pageSize.value })
    list.value = res.data.list || []
    total.value = res.data.total || 0
  } catch { /* handled */ }
  finally { loading.value = false }
}

function statusType(item) {
  if (item.status === 'draft') return 'info'
  if (!item.review_status || item.review_status === 'pending') return 'warning'
  if (item.review_status === 'approved') return ''
  if (item.review_status === 'registered') return 'success'
  if (item.review_status === 'rejected') return 'danger'
  return 'info'
}
function statusText(item) {
  if (item.status === 'draft') return '草稿'
  if (!item.review_status || item.review_status === 'pending') return '审核中'
  if (item.review_status === 'approved') return '已通过'
  if (item.review_status === 'registered') return '已注册'
  if (item.review_status === 'rejected') return '已退回'
  return '-'
}
function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

async function goDetail(item) {
  try {
    const res = await getSubmission(item.id)
    detailData.value = res.data
    // 加载费用明细
    const fc = await getClientCharges(item.id).catch(() => ({ data: { charges: [], total: 0, charge_log: null } }))
    chargeItems.value = fc.data.charges || []
    chargeTotal.value = fc.data.total || 0
    chargeLog.value = fc.data.charge_log || null
    showDetail.value = true
  } catch { /* handled */ }
}

async function handleResubmit(item) {
  try {
    await ElMessageBox.confirm(
      `退回原因: ${item.review_comment}\n\n确认重新提交？`,
      '重新提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }
  try {
    await resubmitSubmission(item.id)
    ElMessage.success('已重新提交，请修改后再次提交')
    router.push(`/client/upload?submission=${item.id}`)
  } catch { /* handled */ }
}
</script>

<style lang="scss" scoped>
.my-submissions { max-width: 860px; margin: 0 auto; }
.page-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
  h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0; }
}
.card-list { display: flex; flex-direction: column; gap: 16px; }

.submission-card {
  background: #fff; border-radius: 12px; padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06); cursor: pointer;
  transition: box-shadow .2s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
}
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-left { display: flex; align-items: center; gap: 12px; }
.app-no { font-size: 18px; font-weight: 700; color: #303133; letter-spacing: 0.5px; }
.card-time { font-size: 12px; color: #c0c4cc; }

.reject-alert { margin-bottom: 12px; }

.card-actions {
  display: flex; justify-content: space-between; align-items: center;
  .card-meta { font-size: 13px; color: #909399; display: flex; align-items: center; gap: 4px; }
}

@media (max-width: 768px) {
  h2 { font-size: 18px; }
  .search-bar { flex-wrap: wrap; }
}
</style>
