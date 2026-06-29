<template>
  <div class="dashboard-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div>
        <h1>欢迎回来，{{ authStore.username }}</h1>
        <p>湘泰正清系统 · 中泰物流清关一站式服务</p>
      </div>
      <div class="welcome-badge">{{ stats.completed_orders || 0 }} 单已完成</div>
    </div>

    <!-- 核心功能入口（大卡片） -->
    <div class="core-entries">
      <div class="core-card upload" @click="$router.push('/client/upload')">
        <div class="core-icon"><el-icon :size="32"><UploadFilled /></el-icon></div>
        <div class="core-info"><div class="core-title">资料上传</div><div class="core-desc">上传清关所需文件资料，快速提交审核</div></div>
        <el-icon :size="20" color="#fff" class="core-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="core-card track" @click="$router.push('/client/tracking')">
        <div class="core-icon"><el-icon :size="32"><Ship /></el-icon></div>
        <div class="core-info"><div class="core-title">货物追踪</div><div class="core-desc">实时查看您的货物清关进度和物流状态</div></div>
        <el-icon :size="20" color="#fff" class="core-arrow"><ArrowRight /></el-icon>
      </div>
      <div class="core-card orders" @click="$router.push('/client/orders')">
        <div class="core-icon"><el-icon :size="32"><Document /></el-icon></div>
        <div class="core-info"><div class="core-title">我的订单</div><div class="core-desc">查看和管理您已完成的历史订单记录</div></div>
        <el-icon :size="20" color="#fff" class="core-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stat-row">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-icon"><el-icon :size="20" :color="card.color"><component :is="card.icon" /></el-icon></div>
        <div class="stat-num">{{ card.value }}</div>
        <div class="stat-label">{{ card.label }}</div>
      </div>
    </div>

    <!-- 公告栏（紧凑） -->
    <div class="announce-bar" v-if="announcements.length > 0">
      <el-icon color="#E6A23C"><WarningFilled /></el-icon>
      <div class="announce-scroll">
        <span v-for="a in announcements" :key="a.id" class="announce-item">
          <el-tag :type="a.type==='warning'?'warning':a.type==='success'?'success':'info'" size="small" effect="plain">{{ a.title }}</el-tag>
          <span class="announce-text">{{ a.content }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import request from '@/api/request'

const router = useRouter()
const authStore = useAuthStore()
const stats = ref({ total_orders:0, active_orders:0, completed_orders:0, total_spent:0, balance:0 })
const announcements = ref([])

const statCards = computed(() => [
  { label:'全部订单', value:stats.value.total_orders, icon:'Document', color:'#409EFF' },
  { label:'进行中', value:stats.value.active_orders, icon:'Ship', color:'#E6A23C' },
  { label:'已完成', value:stats.value.completed_orders, icon:'CircleCheckFilled', color:'#67C23A' },
  { label:'累计消费', value:(stats.value.total_spent||0).toLocaleString()+' ฿', icon:'Money', color:'#F56C6C' },
  { label:'账户余额', value:(stats.value.balance||0).toLocaleString()+' ฿', icon:'Wallet', color:'#409EFF' },
])

onMounted(async () => {
  try {
    const [s, a] = await Promise.all([
      request.get('/finance/client/dashboard-stats'),
      request.get('/finance/announcements'),
    ])
    stats.value = s.data; announcements.value = a.data || []
  } catch { /* */ }
})
</script>

<style scoped>
.dashboard-page { max-width: 960px; margin: 0 auto; }
.welcome-banner { background: linear-gradient(135deg,#409EFF,#2563eb); border-radius:14px; padding:24px 28px; display:flex; justify-content:space-between; align-items:center; color:#fff; margin-bottom:20px; }
.welcome-banner h1 { margin:0 0 4px; font-size:22px; }
.welcome-banner p { margin:0; font-size:13px; opacity:.8; }
.welcome-badge { background:rgba(255,255,255,.2); padding:8px 16px; border-radius:20px; font-size:13px; font-weight:600; }

.core-entries { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:18px; }
.core-card { border-radius:12px; padding:22px 20px; color:#fff; cursor:pointer; display:flex; align-items:center; gap:14px; transition:transform .15s,box-shadow .15s; position:relative; overflow:hidden; }
.core-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.15); }
.core-card.upload { background:linear-gradient(135deg,#f59e0b,#d97706); }
.core-card.track { background:linear-gradient(135deg,#3b82f6,#2563eb); }
.core-card.orders { background:linear-gradient(135deg,#10b981,#059669); }
.core-icon { width:56px; height:56px; background:rgba(255,255,255,.2); border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.core-info { flex:1; }
.core-title { font-size:17px; font-weight:700; margin-bottom:3px; }
.core-desc { font-size:12px; opacity:.85; line-height:1.4; }
.core-arrow { opacity:.6; transition:transform .2s; flex-shrink:0; }
.core-card:hover .core-arrow { transform:translateX(4px); opacity:1; }

.stat-row { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-bottom:14px; }
.stat-card { background:#fff; border-radius:10px; padding:16px 12px; text-align:center; transition:transform .15s; cursor:default; }
.stat-card:hover { transform:translateY(-2px); }
.stat-icon { margin-bottom:6px; }
.stat-num { font-size:22px; font-weight:700; color:#303133; }
.stat-label { font-size:12px; color:#909399; margin-top:2px; }

.announce-bar { background:#fff; border-radius:10px; padding:12px 16px; display:flex; align-items:flex-start; gap:10px; overflow:hidden; }
.announce-scroll { flex:1; display:flex; gap:20px; overflow-x:auto; scrollbar-width:none; }
.announce-scroll::-webkit-scrollbar { display:none; }
.announce-item { display:flex; align-items:center; gap:8px; white-space:nowrap; flex-shrink:0; }
.announce-text { font-size:13px; color:#606266; max-width:400px; overflow:hidden; text-overflow:ellipsis; }
</style>
