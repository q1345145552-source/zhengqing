<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="8" v-for="s in stats" :key="s.label">
        <el-card shadow="hover" class="stat-card" @click="s.link && $router.push(s.link)">
          <div class="stat-item">
            <div class="stat-icon" :style="{ background: s.bg }">
              <el-icon :size="28" :color="s.color"><component :is="s.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ s.value }}</div>
              <div class="stat-label">{{ s.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card header="快捷操作">
          <el-space direction="vertical" :size="12" style="width:100%">
            <el-button type="primary" style="width:100%" @click="$router.push('/employee/review')">
              <el-icon><DocumentChecked /></el-icon> 查看待审核申请
            </el-button>
            <el-button type="success" style="width:100%" @click="$router.push('/employee/review')">
              <el-icon><CircleCheckFilled /></el-icon> 查看待注册申请
            </el-button>
          </el-space>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="系统通知">
          <el-empty description="暂无通知" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/api/request'

const statData = ref({ pending: 0, to_register: 0 })
const stats = ref([
  { label: '待审核', value: 0, icon: 'Clock', color: '#E6A23C', bg: '#fdf6ec', link: '/employee/review' },
  { label: '待注册 Next', value: 0, icon: 'Connection', color: '#409EFF', bg: '#ecf5ff', link: '/employee/review' },
])

onMounted(async () => {
  try { const res = await request.get('/employee/stats'); statData.value = res.data; stats.value[0].value = statData.value.pending; stats.value[1].value = statData.value.to_register }
  catch { /* ignore */ }
})
</script>

<style lang="scss" scoped>
.dashboard { padding: 0; }
.stat-card { cursor: pointer; transition: transform .2s; &:hover { transform: translateY(-4px); }
  .stat-item { display: flex; align-items: center; gap: 16px; }
  .stat-icon { width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
  .stat-value { font-size: 32px; font-weight: 700; color: #303133; }
  .stat-label { font-size: 14px; color: #909399; margin-top: 4px; }
}
</style>
