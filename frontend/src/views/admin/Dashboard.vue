<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <el-row :gutter="16">
      <el-col :span="6" v-for="c in overviewCards" :key="c.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" :style="{background:c.bg}"><el-icon :size="26" :color="c.color"><component :is="c.icon" /></el-icon></div>
            <div class="stat-info"><div class="stat-value">{{ c.value }}</div><div class="stat-label">{{ c.label }}</div></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 订单状态分布 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card header="订单状态分布" shadow="never">
          <el-row :gutter="12">
            <el-col :span="6" v-for="s in statusCards" :key="s.label"><div class="dist-card"><span class="dist-num">{{ s.value }}</span><span class="dist-label">{{ s.label }}</span></div></el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="路线分布" shadow="never">
          <el-row :gutter="12">
            <el-col :span="8" v-for="r in routeCards" :key="r.label"><div class="dist-card"><span class="dist-num">{{ r.value }}</span><span class="dist-label">{{ r.label }}</span></div></el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 财务概览 + 近期订单 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="6">
        <el-card header="财务概览（本月）" shadow="never">
          <div class="finance-list">
            <div class="finance-row"><span>充值总额</span><span class="f-val green">{{ (data.finance?.deposit_month || 0).toLocaleString() }} ฿</span></div>
            <div class="finance-row"><span>扣费总额</span><span class="f-val red">{{ (data.finance?.charge_month || 0).toLocaleString() }} ฿</span></div>
            <el-divider style="margin:8px 0" />
            <div class="finance-row"><span>客户总余额</span><span class="f-val blue">{{ (data.finance?.total_balance || 0).toLocaleString() }} ฿</span></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card header="近期订单" shadow="never">
          <el-table :data="data.recent_orders || []" size="small" stripe max-height="280">
            <el-table-column prop="application_no" label="申请编号" width="160"><template #default="{row}">{{ row.application_no || '#'+row.id }}</template></el-table-column>
            <el-table-column prop="client_name" label="客户" width="100" />
            <el-table-column prop="product_name" label="产品" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="110"><template #default="{row}">{{ statusLabel(row.tracking_status) }}</template></el-table-column>
            <el-table-column label="提交时间" width="160"><template #default="{row}">{{ fmt(row.created_at) }}</template></el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/api/request'
import { getTrackingStatus } from '@/utils/tracking'

const data = ref({ overview: {}, status_distribution: {}, route_distribution: {}, finance: {}, recent_orders: [] })

const overviewCards = computed(() => [
  { label: '总客户数', value: data.value.overview?.total_clients || 0, icon: 'UserFilled', color: '#409EFF', bg: '#ecf5ff' },
  { label: '本月新增客户', value: data.value.overview?.new_clients_month || 0, icon: 'User', color: '#67C23A', bg: '#f0f9eb' },
  { label: '本月订单数', value: data.value.overview?.orders_month || 0, icon: 'Document', color: '#E6A23C', bg: '#fdf6ec' },
  { label: '本月总收入', value: (data.value.overview?.revenue_month || 0).toLocaleString() + ' ฿', icon: 'Money', color: '#F56C6C', bg: '#fef0f0' },
])

const statusCards = computed(() => [
  { label: '待审核', value: data.value.status_distribution?.pending || 0 },
  { label: '审核通过', value: data.value.status_distribution?.approved || 0 },
  { label: '运输中', value: data.value.status_distribution?.in_transit || 0 },
  { label: '已完成', value: data.value.status_distribution?.completed || 0 },
])

const routeCards = computed(() => [
  { label: '南宁', value: data.value.route_distribution?.nanning || 0 },
  { label: '广州深圳', value: data.value.route_distribution?.guangzhou || 0 },
  { label: '义乌', value: data.value.route_distribution?.yiwu || 0 },
])

onMounted(async () => {
  try { const res = await request.get('/admin/dashboard'); data.value = res.data }
  catch { /* ignore */ }
})

function statusLabel(s) { return getTrackingStatus(s).label }
function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style lang="scss" scoped>
.dashboard { padding: 0; }
.stat-card { .stat-item { display: flex; align-items: center; gap: 16px; }
  .stat-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #303133; }
  .stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
}
.dist-card { text-align: center; padding: 12px 0; .dist-num { display: block; font-size: 32px; font-weight: 700; color: #303133; } .dist-label { font-size: 13px; color: #909399; margin-top: 4px; } }
.finance-list { .finance-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #606266; }
  .f-val { font-weight: 700; &.green { color: #67C23A; } &.red { color: #F56C6C; } &.blue { color: #409EFF; } }
}
</style>
