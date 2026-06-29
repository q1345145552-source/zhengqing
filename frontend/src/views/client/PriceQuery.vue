<template>
  <div class="price-page">
    <h2><el-icon><Money /></el-icon> 价格查询</h2>

    <el-tabs v-model="tab" type="border-card">
      <!-- Tab1: 价格表 -->
      <el-tab-pane label="价格表" name="table">
        <h3><el-icon><Ship /></el-icon> 运输价格（泰铢）</h3>
        <el-row :gutter="20">
          <el-col :span="8" v-for="t in prices.transport" :key="t.route">
            <el-card shadow="hover" class="route-card">
              <template #header><div class="route-header"><span class="route-name">{{ t.name }}</span><el-tag size="small">{{ t.time }}</el-tag></div></template>
              <div class="route-rules">
                <div v-for="r in t.rules" :key="r.fee_type" class="rule-row">
                  <span class="rule-name">{{ r.fee_name }}</span>
                  <span class="rule-price">{{ r.unit_price.toLocaleString() }} ฿<span v-if="r.unit==='per_cbm'">/m³</span><span v-else-if="r.unit==='per_kg'">/kg</span></span>
                </div>
              </div>
              <div class="route-note">运费按体积和重量计算的较大值收取</div>
            </el-card>
          </el-col>
        </el-row>

        <h3 style="margin-top:24px"><el-icon><Setting /></el-icon> 附加服务价格</h3>
        <el-table :data="addonServiceList" stripe style="max-width:700px">
          <el-table-column prop="fee_name" label="服务项目" min-width="200" />
          <el-table-column label="价格" width="200"><template #default="{row}"><strong>{{ row.unit_price.toLocaleString() }} ฿</strong> {{ row.description }}</template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab2: 费用预估 -->
      <el-tab-pane label="费用预估" name="estimate">
        <p style="color:#909399;margin-bottom:16px">输入体积和重量，选择路线，计算国际运费（仅供参考，以员工核算为准）</p>

        <div class="estimate-form">
          <!-- 基本参数 -->
          <el-form :model="est" label-width="100px" inline>
            <el-form-item label="发货路线">
              <el-select v-model="est.route" style="width:200px">
                <el-option label="南宁→曼谷" value="nanning_bangkok" />
                <el-option label="广州深圳→曼谷" value="guangzhou_bangkok" />
                <el-option label="义乌→曼谷" value="yiwu_bangkok" />
              </el-select>
            </el-form-item>
            <el-form-item label="体积(CBM)">
              <el-input-number v-model="est.volume" :min="0" :step="0.1" :precision="2" style="width:140px" />
            </el-form-item>
            <el-form-item label="重量(KG)">
              <el-input-number v-model="est.weight" :min="0" :step="0.5" style="width:140px" />
            </el-form-item>
          </el-form>

          <!-- 附加服务勾选 -->
          <div class="addon-section">
            <div class="addon-title">附加服务（可选勾选）</div>
            <div v-for="s in addonServiceList" :key="s.fee_type" class="addon-row">
              <el-checkbox v-model="addonSelected[s.fee_type]">
                <span class="addon-label">{{ s.fee_name }}</span>
                <span class="addon-price">{{ s.unit_price.toLocaleString() }} ฿</span>
                <span v-if="s.description" class="addon-desc">{{ s.description }}</span>
              </el-checkbox>
              <template v-if="addonSelected[s.fee_type] && s.fee_type === 'pallet'">
                <span class="addon-qty-label">数量</span>
                <el-input-number v-model="addonQuantity.pallet" :min="1" size="small" style="width:80px" /> 托
              </template>
              <template v-if="addonSelected[s.fee_type] && s.fee_type === 'wooden_box'">
                <span class="addon-qty-label">体积</span>
                <el-input-number v-model="addonQuantity.wooden_box" :min="0" :step="0.1" :precision="2" size="small" style="width:100px" /> m³
              </template>
            </div>
          </div>

          <el-button type="primary" :loading="calcLoading" @click="doEstimate" style="margin-top:16px">计算预估费用</el-button>
        </div>

        <!-- 计算结果 -->
        <div v-if="calcDone" style="margin-top:24px">
          <div class="result-card">
            <div class="result-row">
              <span class="result-label">运费</span>
              <span class="result-value">{{ freightAmount.toLocaleString() }} ฿</span>
            </div>
            <div v-if="addonTotal > 0" class="result-row">
              <span class="result-label">附加服务</span>
              <span class="result-value">{{ addonTotal.toLocaleString() }} ฿</span>
            </div>
            <el-divider style="margin:12px 0" />
            <div class="result-row result-row-total">
              <span class="result-label">总计</span>
              <span class="result-value result-value-total">{{ (freightAmount + addonTotal).toLocaleString() }} ฿</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-divider />
    <p class="footnote">以上价格如有调整以最新为准，预估结果仅供参考，实际费用以员工核算为准。</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import request from '@/api/request'

const tab = ref('table')
const prices = ref({ transport: [], services: [] })
const est = reactive({ route: 'nanning_bangkok', volume: 0, weight: 0 })
const freightAmount = ref(0)
const calcDone = ref(false)
const calcLoading = ref(false)

// 附加服务勾选状态
const addonSelected = reactive({
  form_e: false,
  china_customs: false,
  thai_customs: false,
  pallet: false,
  wooden_box: false,
})

// 附加服务数量（仅 pallet / wooden_box 需要）
const addonQuantity = reactive({
  pallet: 1,
  wooden_box: 0,
})

// 过滤掉境内物流，只保留清关相关附加服务
const addonServiceList = computed(() => {
  const excludeTypes = ['domestic_bluewhite', 'domestic_flash', 'domestic_kerry', 'domestic_nim']
  return (prices.value.services || []).filter(s => !excludeTypes.includes(s.fee_type))
})

// 根据勾选计算附加服务金额
const addonTotal = computed(() => {
  let total = 0
  const findPrice = (type) => {
    const s = addonServiceList.value.find(a => a.fee_type === type)
    return s ? s.unit_price : 0
  }
  if (addonSelected.form_e) total += findPrice('form_e')
  if (addonSelected.china_customs) total += findPrice('china_customs')
  if (addonSelected.thai_customs) total += findPrice('thai_customs')
  if (addonSelected.pallet) {
    const qty = addonQuantity.pallet || 1
    total += findPrice('pallet') * qty
  }
  if (addonSelected.wooden_box) {
    const cbm = addonQuantity.wooden_box || 0
    const price = findPrice('wooden_box')
    let amount = price * cbm
    if (amount > 0 && amount < 1000) amount = 1000  // 最低 1000 泰铢
    total += amount
  }
  return Math.round(total * 100) / 100
})

onMounted(async () => {
  try { const res = await request.get('/finance/client/prices'); prices.value = res.data } catch { /* */ }
})

async function doEstimate() {
  if (est.volume <= 0 && est.weight <= 0) { calcDone.value = false; return }
  calcLoading.value = true
  try {
    const res = await request.post('/finance/client/estimate', {
      route: est.route,
      volume: est.volume,
      weight: est.weight,
    })
    const all = res.data.charges || []
    const selected = all.find(c => (c.fee_type === 'freight_cbm' || c.fee_type === 'freight_kg') && c.selected)
    freightAmount.value = selected ? selected.amount : 0
    calcDone.value = true
  } catch { /* */ }
  finally { calcLoading.value = false }
}
</script>

<style scoped>
.price-page { max-width: 1100px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
h3 { display: flex; align-items: center; gap: 8px; font-size: 18px; margin: 0 0 16px; color: #303133; }
.route-card { height: 100%; }
.route-header { display: flex; justify-content: space-between; align-items: center; }
.route-name { font-size: 16px; font-weight: 600; }
.route-rules { display: flex; flex-direction: column; gap: 10px; }
.rule-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed #ebeef5; }
.rule-name { font-size: 14px; color: #606266; }
.rule-price { font-size: 15px; font-weight: 600; color: #409EFF; }
.route-note { margin-top: 12px; font-size: 12px; color: #E6A23C; text-align: center; }
.estimate-form { background: #fafafa; padding: 20px; border-radius: 8px; }
.footnote { color: #c0c4cc; font-size: 13px; text-align: center; }

/* 附加服务区域 */
.addon-section { margin-top: 16px; padding-top: 16px; border-top: 1px dashed #dcdfe6; }
.addon-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.addon-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.addon-label { font-size: 14px; color: #606266; margin-right: 8px; }
.addon-price { font-size: 14px; font-weight: 600; color: #E6A23C; margin-right: 8px; }
.addon-desc { font-size: 12px; color: #909399; }
.addon-qty-label { font-size: 13px; color: #909399; margin-left: 8px; }

/* 结果卡片 */
.result-card { max-width: 400px; margin: 0 auto; padding: 24px; background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
.result-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
.result-label { font-size: 16px; color: #606266; }
.result-value { font-size: 18px; font-weight: 600; color: #303133; }
.result-row-total { padding-top: 4px; }
.result-value-total { font-size: 28px; color: #409EFF; }
</style>
