<template>
  <div class="client-review-page">
    <h2><el-icon><UserFilled /></el-icon> 客户审核</h2>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="待审核" name="pending" />
      <el-tab-pane label="已通过" name="active" />
      <el-tab-pane label="已拒绝" name="rejected" />
    </el-tabs>

    <el-table :data="list" stripe v-loading="loading" empty-text="暂无数据">
      <el-table-column prop="username" label="用户名" width="140" />
      <el-table-column label="公司名称" min-width="160">
        <template #default="{ row }">{{ row.real_name || '未填写' }}</template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
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

    <!-- Reject dialog -->
    <el-dialog v-model="showReject" title="拒绝原因" width="400px">
      <el-input v-model="rejectComment" type="textarea" :rows="3" placeholder="请输入拒绝原因（选填）" />
      <template #footer>
        <el-button @click="showReject = false">取消</el-button>
        <el-button type="danger" :loading="reviewing" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'

var activeTab = ref('pending')
var list = ref([])
var loading = ref(false)
var page = ref(1)
var pageSize = ref(20)
var total = ref(0)
var showReject = ref(false)
var reviewing = ref(false)
var rejectComment = ref('')
var currentRow = ref(null)

onMounted(function() { loadData() })

function handleTabChange() { page.value = 1; loadData() }

async function loadData() {
  loading.value = true
  try {
    var res = await request.get('/admin/client-review', { params: { filter: activeTab.value, page: page.value, pageSize: pageSize.value } })
    list.value = res.data.list
    total.value = res.data.total
  } catch { /* */ }
  finally { loading.value = false }
}

function handleReview(row, action) {
  currentRow.value = row
  if (action === 'reject') {
    rejectComment.value = ''
    showReject.value = true
    return
  }
  ElMessageBox.confirm('确认通过客户 ' + row.username + ' 的注册申请？', '审核确认', {
    confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'success',
  }).then(async function() {
    reviewing.value = true
    try {
      await request.put('/admin/client-review/' + row.id, { action: 'approve' })
      ElMessage.success('已通过审核')
      loadData()
    } catch { /* */ }
    finally { reviewing.value = false }
  }).catch(function() {})
}

async function confirmReject() {
  reviewing.value = true
  try {
    await request.put('/admin/client-review/' + currentRow.value.id, { action: 'reject', comment: rejectComment.value })
    ElMessage.success('已拒绝')
    showReject.value = false
    loadData()
  } catch { /* */ }
  finally { reviewing.value = false }
}

function statusTag(s) { return s === 'active' ? 'success' : s === 'rejected' ? 'danger' : 'warning' }
function statusLabel(s) { return s === 'active' ? '已通过' : s === 'rejected' ? '已拒绝' : '待审核' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.client-review-page { max-width: 1100px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
</style>
