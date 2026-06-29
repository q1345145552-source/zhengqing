<template>
  <div class="notifications-page">
    <div class="page-header">
      <h2><el-icon><Bell /></el-icon> 消息通知</h2>
      <el-button size="small" @click="markAllRead" v-if="list.some(n=>!n.is_read)">全部已读</el-button>
    </div>

    <div v-loading="loading" class="notif-list">
      <el-empty v-if="list.length === 0" description="暂无通知" />
      <div
        v-for="n in list" :key="n.id"
        class="notif-item" :class="{ unread: !n.is_read }"
        @click="handleClick(n)"
      >
        <div class="notif-dot" v-if="!n.is_read" />
        <div class="notif-body">
          <div class="notif-title">
            <el-tag :type="n.type" size="small">{{ n.title }}</el-tag>
            <span class="notif-time">{{ format(n.created_at) }}</span>
          </div>
          <p v-if="n.content" class="notif-content">{{ n.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const list = ref([])
const loading = ref(false)

onMounted(loadData)
async function loadData() {
  loading.value = true
  try { const res = await request.get('/finance/notifications'); list.value = res.data || [] }
  catch { /* ignore */ }
  finally { loading.value = false }
}

async function handleClick(n) {
  if (!n.is_read) { await request.put(`/finance/notifications/${n.id}/read`); n.is_read = true }
  if (n.related_type === 'submission' && n.related_id) {
    router.push(`/client/submissions`)
  }
}
async function markAllRead() {
  await request.put('/finance/notifications/read-all')
  list.value.forEach(n => n.is_read = true)
}
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.notifications-page { max-width: 700px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0; }
.notif-list { display: flex; flex-direction: column; gap: 0; }
.notif-item { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-bottom: 1px solid #ebeef5; cursor: pointer; transition: background .2s; }
.notif-item:hover { background: #f5f7fa; }
.notif-item.unread { background: #ecf5ff; }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #F56C6C; margin-top: 6px; flex-shrink: 0; }
.notif-body { flex: 1; }
.notif-title { display: flex; justify-content: space-between; align-items: center; }
.notif-time { font-size: 12px; color: #c0c4cc; }
.notif-content { margin: 6px 0 0; font-size: 14px; color: #606266; line-height: 1.5; }
</style>
