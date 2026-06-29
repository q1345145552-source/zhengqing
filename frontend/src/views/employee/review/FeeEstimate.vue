<template>
  <div class="fee-page">
    <h2><el-icon><Money /></el-icon> 费用预估</h2>
    <p class="page-desc">独立运费计算工具，不关联具体申请，适合电话报价或快速查询</p>

    <el-row :gutter="24">
      <!-- 区域一：参数输入 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><div class="card-title"><el-icon><Setting /></el-icon> 计费参数</div></template>
          <el-form :model="params" label-width="110px" size="small">
            <el-form-item label="国际路线">
              <el-select v-model="params.route" style="width:100%">
                <el-option label="南宁→曼谷" value="nanning_bangkok" />
                <el-option label="广州深圳→曼谷" value="guangzhou_bangkok" />
                <el-option label="义乌→曼谷" value="yiwu_bangkok" />
              </el-select>
            </el-form-item>
            <el-form-item label="体积(CBM)">
              <el-input-number v-model="params.volume" :min="0" :step="0.1" :precision="2" style="width:100%" />
            </el-form-item>
            <el-form-item label="重量(KG)">
              <el-input-number v-model="params.weight" :min="0" :step="0.5" style="width:100%" />
            </el-form-item>
            <el-form-item label="境内物流">
              <el-select v-model="params.domestic_logistics" clearable placeholder="不选则不计算境内运费" style="width:100%">
                <el-option label="BlueWhite 蓝白" value="bluewhite" />
                <el-option label="Flash Express" value="flash" />
                <el-option label="Kerry Express" value="kerry" />
                <el-option label="Nim Express" value="nim" />
                <el-option label="NSS 曼谷自提(免费)" value="nss" />
              </el-select>
            </el-form-item>
            <el-form-item label="入仓日期">
              <el-date-picker v-model="params.warehouse_entry_date" type="date" placeholder="选填" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
            <el-form-item label="托盘数">
              <el-input-number v-model="params.pallet_count" :min="0" style="width:100%" />
            </el-form-item>
            <el-form-item label="木箱CBM">
              <el-input-number v-model="params.wooden_box_cbm" :min="0" :step="0.1" :precision="2" style="width:100%" />
            </el-form-item>
          </el-form>

          <div class="addon-section">
            <div class="addon-title">附加服务</div>
            <div v-for="s in addonList" :key="s.key" class="addon-row">
              <el-checkbox v-model="s.checked">{{ s.label }} <span class="addon-price">{{ s.price }} ฿{{ s.unit }}</span></el-checkbox>
              <template v-if="s.checked && s.key === 'pallet'">
                <el-input-number v-model="addonQty.pallet" :min="1" size="small" style="width:70px;margin-left:8px" /> 托
              </template>
              <template v-if="s.checked && s.key === 'wooden_box'">
                <el-input-number v-model="addonQty.wooden_box" :min="0" :step="0.1" :precision="2" size="small" style="width:90px;margin-left:8px" /> m³
              </template>
            </div>
          </div>

          <el-button type="primary" :loading="calcLoading" @click="doCalc" style="margin-top:16px;width:100%">
            <el-icon><Money /></el-icon> 计算费用
          </el-button>
        </el-card>
      </el-col>

      <!-- 区域二：计算结果 -->
      <el-col :span="12">
        <el-card v-if="result" shadow="never">
          <template #header><div class="card-title"><el-icon><Tickets /></el-icon> 计算结果（泰铢）</div></template>

          <!-- 国际运费 -->
          <h4>国际运费</h4>
          <el-table :data="freightRows" size="small" stripe>
            <el-table-column prop="label" label="计费方式" min-width="200" />
            <el-table-column label="金额" width="130">
              <template #default="{row}">
                <span :style="{fontWeight:row.selected?'700':'400',color:row.selected?'#67C23A':'#909399'}">
                  {{ row.amount }} ฿ <el-tag v-if="row.selected" size="small" type="success">采纳</el-tag>
                </span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="maxNote" class="note-bar">{{ maxNote }}</div>

          <!-- 境内运费 -->
          <h4 style="margin-top:14px">境内运费</h4>
          <div class="info-line"><span>{{ domesticName }}</span><span class="amount">{{ domesticAmount }} ฿</span></div>

          <!-- 仓储费 -->
          <h4 style="margin-top:14px">仓储费</h4>
          <div class="info-line"><span>{{ storageDays > 0 ? `仓储 ${storageDays} 天` : '未选择入仓日期' }}</span><span class="amount">{{ storageFee }} ฿</span></div>

          <!-- 附加服务 -->
          <template v-if="addonTotal > 0">
            <h4 style="margin-top:14px">附加服务</h4>
            <div class="info-line"><span>勾选 {{ addonCheckedCount }} 项</span><span class="amount">{{ addonTotal }} ฿</span></div>
          </template>

          <el-divider />
          <div class="total-line">费用总计 <span class="total-amount">{{ grandTotal.toLocaleString() }} ฿</span></div>
        </el-card>

        <!-- 区域三：快速备注 -->
        <el-card v-if="result" shadow="never" style="margin-top:14px">
          <template #header><div class="card-title"><el-icon><Edit /></el-icon> 快速备注</div></template>
          <el-input v-model="noteName" placeholder="客户名称/备注（不保存，仅参考）" size="small" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import request from '@/api/request'

const params = reactive({
  route: 'nanning_bangkok', domestic_logistics: '', volume: 0, weight: 0,
  pallet_count: 0, wooden_box_cbm: 0, warehouse_entry_date: ''
})

// 附加服务（从价格表动态加载）
const servicePrices = ref({})
const addonList = reactive([
  { key: 'form_e', label: 'Form E 原产地证费', price: 4000, unit: '', checked: false },
  { key: 'china_customs', label: '中国清关费', price: 4000, unit: '', checked: false },
  { key: 'thai_customs', label: '泰国清关费', price: 3500, unit: '', checked: false },
  { key: 'pallet', label: '打托盘费', price: 1800, unit: '/托', checked: false },
  { key: 'wooden_box', label: '木箱打包费', price: 2500, unit: '/m³', checked: false },
])
const addonQty = reactive({ pallet: 1, wooden_box: 0 })

const result = ref(null)
const calcLoading = ref(false)
const noteName = ref('')
const maxNote = ref('')
const domesticName = ref('')
const domesticAmount = ref(0)
const storageDays = ref(0)
const storageFee = ref(0)

// Load prices from API
import { onMounted } from 'vue'
onMounted(async () => {
  try {
    const res = await request.get('/finance/client/prices')
    const svcs = res.data?.services || []
    const priceMap = {}
    svcs.forEach(s => { priceMap[s.fee_type] = s.unit_price })
    servicePrices.value = priceMap
    // Update addon list with real prices
    addonList.forEach(a => {
      if (priceMap[a.key]) a.price = priceMap[a.key]
    })
  } catch { /* */ }
})

const freightRows = computed(() => {
  if (!result.value) return []
  const charges = result.value.charges || []
  const cbm = charges.find(c => c.fee_type === 'freight_cbm')
  const kg = charges.find(c => c.fee_type === 'freight_kg')
  const rows = []
  if (cbm) rows.push({ label: cbm.fee_name, amount: cbm.amount, selected: cbm.selected })
  if (kg) rows.push({ label: kg.fee_name, amount: kg.amount, selected: kg.selected })
  return rows
})

const addonCheckedCount = computed(() => addonList.filter(a => a.checked).length)
const addonTotal = computed(() => {
  let t = 0
  if (addonList.find(a => a.key === 'form_e')?.checked) t += addonList.find(a => a.key === 'form_e').price
  if (addonList.find(a => a.key === 'china_customs')?.checked) t += addonList.find(a => a.key === 'china_customs').price
  if (addonList.find(a => a.key === 'thai_customs')?.checked) t += addonList.find(a => a.key === 'thai_customs').price
  if (addonList.find(a => a.key === 'pallet')?.checked) t += addonList.find(a => a.key === 'pallet').price * (addonQty.pallet || 1)
  if (addonList.find(a => a.key === 'wooden_box')?.checked) {
    const cbm = addonQty.wooden_box || 0
    const price = addonList.find(a => a.key === 'wooden_box').price
    let amount = price * cbm
    if (amount > 0 && amount < 1000) amount = 1000
    t += amount
  }
  return Math.round(t * 100) / 100
})

const grandTotal = computed(() => {
  const freight = result.value?.total || 0
  const freightNote = result.value?.charges?.find(c => c.fee_type === 'freight_max_note')
  // The API total includes domestic + storage when selected, but our addon total is separate
  return Math.round((freight + addonTotal.value) * 100) / 100
})

async function doCalc() {
  if (params.volume <= 0 && params.weight <= 0) return
  calcLoading.value = true
  try {
    const res = await request.post('/finance/client/estimate', {
      route: params.route,
      volume: params.volume,
      weight: params.weight,
      domestic_logistics: params.domestic_logistics || '',
      warehouse_entry_date: params.warehouse_entry_date || '',
      pallet_count: addonList.find(a => a.key === 'pallet')?.checked ? (addonQty.pallet || 1) : 0,
      wooden_box_cbm: addonList.find(a => a.key === 'wooden_box')?.checked ? (addonQty.wooden_box || 0) : 0,
    })
    result.value = res.data
    // Extract domestic info
    const domCharge = (res.data.charges || []).find(c => c.fee_type === 'domestic_freight')
    domesticName.value = domCharge?.fee_name || '未选择'
    domesticAmount.value = domCharge?.amount || 0
    const stCharge = (res.data.charges || []).find(c => c.fee_type === 'storage')
    storageFee.value = stCharge?.amount || 0
    storageDays.value = stCharge?.quantity || 0
    const note = (res.data.charges || []).find(c => c.fee_type === 'freight_max_note')
    maxNote.value = note?.fee_name || ''
  } catch { /* */ }
  finally { calcLoading.value = false }
}
</script>

<style scoped>
.fee-page { max-width: 1100px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 4px; }
.page-desc { color: #909399; font-size: 14px; margin: 0 0 20px; }
.card-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }
h4 { font-size: 14px; color: #606266; margin: 0 0 6px; }
.addon-section { margin-top: 8px; padding-top: 12px; border-top: 1px dashed #dcdfe6; }
.addon-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 8px; }
.addon-row { display: flex; align-items: center; padding: 4px 0; }
.addon-price { color: #E6A23C; font-weight: 600; margin-left: 4px; }
.note-bar { margin-top: 6px; padding: 6px 10px; background: #ecf5ff; border-radius: 4px; color: #409EFF; font-weight: 600; font-size: 13px; text-align: center; }
.info-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #606266; }
.amount { font-weight: 600; color: #303133; }
.total-line { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; }
.total-amount { font-size: 26px; color: #409EFF; }
</style>
