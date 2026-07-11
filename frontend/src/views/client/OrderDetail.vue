<template>
  <div class="client-page detail-page" v-loading="loading">
    <div class="page-top">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <div class="top-info" v-if="data.id">
        <div class="top-title-row">
          <span class="top-app-no">{{ data.application_no || '订单 #' + data.id }}</span>
          <el-tag type="info" size="large" effect="dark" style="font-size:15px">已完成</el-tag>
        </div>
        <div v-if="data.step1?.thai_name || data.step1?.english_name" class="top-meta-row">{{ data.step1.thai_name || data.step1.english_name }}</div>
        <div class="top-numbers">
          <span v-if="data.step1?.tariff_rate">关税 {{ data.step1.tariff_rate }}</span>
          <span>运费 {{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</span>
        </div>
        <div class="top-time">完成于 {{ fmt(data.tracking_status_updated_at) }}</div>
      </div>
    </div>

    <div v-if="data.id" class="blocks">
      <!-- 产品 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Goods /></el-icon> 产品信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="产品泰文名">{{ data.step1?.thai_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品英文名">{{ data.step1?.english_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品描述">{{ data.step1?.license_notes || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品图片" :span="2">
            <template v-if="step1Images.length">
              <el-image v-for="(img,i) in step1Images" :key="i" :src="fileUrl(img)" style="width:60px;height:60px;margin-right:6px" fit="cover" :preview-src-list="step1Images.map(f=>fileUrl(f))" />
            </template>
            <span v-else style="color:#c0c4cc">无</span>
          </el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:12px">员工审核确认</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="HS Code">{{ data.step1?.hs_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关税税率">{{ data.step1?.tariff_rate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Form E">{{ data.step1?.form_e_eligible ? '可用' : '不可用' }}</el-descriptions-item>
          <el-descriptions-item label="许可证">{{ data.step1?.license_required ? '需要' : '不需要' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 公司 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Office /></el-icon> 公司信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="公司名称">{{ data.step2?.company_name || data.client_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="公司税号">{{ data.step2?.tax_id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="泰国地址">{{ data.step2?.thai_address || '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:12px">公司文件</h4>
        <el-table :data="step2Files" size="small" stripe>
          <el-table-column prop="label" label="文件类型" width="140" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{row}"><el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link><span v-else style="color:#c0c4cc">未上传</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 报关 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Lock /></el-icon> 报关授权</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="授权类型"><el-tag :type="data.step3?.handler_type==='director'?'success':'warning'" size="small">{{ data.step3?.handler_type==='director'?'董事本人办理':'委托办理' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="报关账号">{{ data.step3?.account_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报关密码">{{ data.step3?.password ? '******' : '-' }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="data.step3?.handler_type==='agent'">
          <h4 style="margin-top:12px">委托文件</h4>
          <el-table :data="step3Files" size="small" stripe>
            <el-table-column prop="label" label="文件类型" width="140" />
            <el-table-column label="文件名" min-width="250">
              <template #default="{row}"><el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link><span v-else style="color:#c0c4cc">未上传</span></template>
            </el-table-column>
          </el-table>
        </template>
      </el-card>

      <!-- 退税 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Tickets /></el-icon> 退税信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="退税方案"><el-tag :type="data.step4?.need_rebate?'warning':'info'" size="small">{{ data.step4?.need_rebate?'需要退税':'无需退税（货代）' }}</el-tag></el-descriptions-item>
          <template v-if="data.step4?.need_rebate">
            <el-descriptions-item label="报关公司">{{ data.step4?.customs_company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流对接人">{{ data.step4?.logistics_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流编码">{{ data.step4?.logistics_code || '-' }}</el-descriptions-item>
          </template>
        </el-descriptions>
        <h4 style="margin-top:12px">相关文件</h4>
        <el-table :data="step4Files" size="small" stripe>
          <el-table-column prop="label" label="文件类型" width="140" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{row}"><el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link><span v-else style="color:#c0c4cc">未上传</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 发货 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Ship /></el-icon> 发货信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="运单号">{{ data.tracking_number || data.step5?.tracking_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ fmt(data.shipped_at || data.step5?.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item label="到仓时间">{{ fmt(data.arrived_at_warehouse) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 费用明细和扣款记录 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Money /></el-icon> 费用明细和扣款记录</div></template>
        <h4>国际运费</h4>
        <el-table :data="freightRows" size="small" stripe>
          <el-table-column prop="label" label="计费方式" min-width="240" />
          <el-table-column label="金额" width="140">
            <template #default="{row}"><span :style="{fontWeight:row.selected?'700':'400',color:row.selected?'#67C23A':'#909399'}">{{ row.amount }} ฿ <el-tag v-if="row.selected" size="small" type="success">采纳</el-tag></span></template>
          </el-table-column>
        </el-table>
        <div v-if="data.finance?.freight_max_note" class="freight-note">{{ data.finance.freight_max_note }}</div>
        <h4 style="margin-top:14px">境内运费</h4>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="物流公司">{{ data.finance?.domestic_logistics_name || '未选择' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ data.finance?.domestic_freight?.fee_name || '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:14px">仓储费</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="仓储天数">{{ data.finance?.storage_days || 0 }} 天</el-descriptions-item>
          <el-descriptions-item label="金额">{{ data.finance?.storage?.amount || 0 }} ฿</el-descriptions-item>
        </el-descriptions>
        <h4 v-if="(data.finance?.services||[]).length" style="margin-top:14px">附加服务</h4>
        <el-table v-if="(data.finance?.services||[]).length" :data="data.finance.services" size="small" stripe>
          <el-table-column prop="fee_name" label="服务项目" min-width="200" />
          <el-table-column label="金额" width="120"><template #default="{row}">{{ row.amount }} ฿</template></el-table-column>
          <el-table-column label="状态" width="70"><template #default="{row}"><el-tag :type="row.selected?'success':'info'" size="small">{{ row.selected?'已选':'未选' }}</el-tag></template></el-table-column>
        </el-table>
        <div v-if="data.customs_duty_amount !== undefined" style="margin-top:14px;padding:12px 16px;background:#fdf6ec;border:1px solid #faecd8;border-radius:6px">
          <span style="color:#909399;font-size:13px">海关关税（关税+货值的7%）</span>
          <span style="font-weight:700;color:#E6A23C;font-size:16px;margin-left:12px">{{ (data.customs_duty_amount || 0).toLocaleString() }} ฿</span>
        </div>
                <div class="total-bar" style="margin-top:12px">费用合计（不含税） <span>{{ (data.finance?.subtotal_amount || 0).toLocaleString() }} ฿</span></div>
        <div class="total-bar" style="color:#606266;font-size:14px">增值税 VAT 7% <span>{{ Math.round(((data.finance?.subtotal_amount || 0) - (data.customs_duty_amount || 0)) * 0.07).toLocaleString() }} ฿</span></div>
        <div class="total-bar" style="color:#E6A23C;font-weight:700;font-size:16px">含税总计 <span>{{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</span></div>

        <!-- 扣款记录 -->
        <el-divider style="margin:20px 0" />
        <h4 style="margin-bottom:12px">扣款记录</h4>
        <div v-if="data.finance?.charge_log?.status==='charged'" class="pay-block pay-done">
          <div class="pay-icon-wrap"><el-icon :size="36" color="#fff"><CircleCheckFilled /></el-icon></div>
          <div class="pay-text">
            <div class="pay-title">已扣款</div>
            <div class="balance-rows" style="margin:6px 0">
              <div class="balance-row" v-if="data.finance?.charge_balance_before !== null">
                <span>扣费前余额</span>
                <span>{{ Math.round(data.finance.charge_balance_before).toLocaleString() }} ฿</span>
              </div>
              <div class="balance-row balance-charge">
                <span>扣费金额</span>
                <span style="color:#F56C6C">-{{ (data.finance.charge_log.total_amount || 0).toLocaleString() }} ฿</span>
              </div>
              <div class="balance-row" v-if="data.finance?.charge_balance_after !== null">
                <span>扣费后余额</span>
                <span style="font-weight:700;color:#303133">{{ Math.round(data.finance.charge_balance_after).toLocaleString() }} ฿</span>
              </div>
            </div>
            <div class="pay-time">扣款时间：{{ fmt(data.finance.charge_log.charged_at) }}</div>
          </div>
        </div>
        <div v-else class="pay-block pay-pending">
          <div class="pay-icon-wrap"><el-icon :size="36" color="#fff"><Clock /></el-icon></div>
          <div class="pay-text">
            <div class="pay-title">待付款</div>
            <div class="pay-amount">应付 {{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</div>
            <div class="pay-time">货物到仓时自动扣款</div>
          </div>
        </div>
      </el-card>

      <!-- 发票下载 -->
      <el-card v-if="data.tracking_status === 9" shadow="never">
        <template #header><div class="block-title"><el-icon><Document /></el-icon> 发票下载</div></template>
        <div style="display:flex;gap:12px">
          <el-button type="primary" @click="downloadInvoice('zh')">
            <el-icon><Download /></el-icon> 中文发票
          </el-button>
          <el-button type="success" @click="downloadInvoice('th')">
            <el-icon><Download /></el-icon> ใบแจ้งหนี้ภาษาไทย
          </el-button>
        </div>
      </el-card>

      <!-- 海关文件 -->
      <el-card v-if="customsDocs.length > 0" shadow="never">
        <template #header><div class="block-title"><el-icon><FolderOpened /></el-icon> 海关回传文件</div></template>
        <el-table :data="customsDocs" size="small" stripe>
          <el-table-column label="文件类型" width="140"><template #default="{row}">{{ customsDocLabel(row.file_type) }}</template></el-table-column>
          <el-table-column prop="file_name" label="文件名" min-width="250" show-overflow-tooltip />
          <el-table-column label="上传时间" width="160"><template #default="{row}">{{ fmt(row.created_at) }}</template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{row}"><el-link type="primary" :href="row.file_path" target="_blank">下载</el-link></template></el-table-column>
        </el-table>
      </el-card>

      <!-- 时间线 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Timer /></el-icon> 状态时间线</div></template>
        <el-timeline v-if="timeline.length > 0">
          <el-timeline-item v-for="(t,i) in timeline" :key="i" :timestamp="fmt(t.time)" placement="top" :color="t.color" :hollow="i > 0">
            <span :style="{fontWeight:i===0?'700':'400'}">{{ t.title }}</span>
          </el-timeline-item>
        </el-timeline>
        <div v-else style="color:#c0c4cc;text-align:center;padding:16px">暂无记录</div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'
import { CircleCheckFilled, Clock, Download, Document } from '@element-plus/icons-vue'

const route = useRoute()
const loading = ref(false)
const data = reactive({})
const timeline = ref([])
const customsDocs = ref([])

const step1Images = computed(() => { const imgs = data.step1?.product_images || []; return Array.isArray(imgs) ? imgs : [] })
const toFileArray = (field) => {
  if (!field) return []
  if (Array.isArray(field)) return field
  return [field]
}

const step2Files = computed(() => [
  { key: 'dbd_file', label: 'DBD 文件' },
  { key: 'pp20_file', label: 'PP.20 文件' },
  { key: 'company_stamp_file', label: '公司印章' },
  { key: 'director_passport_file', label: '法人护照' },
].flatMap(f => {
  const files = toFileArray(data.step2?.[f.key])
  return files.map((file, i) => ({
    label: files.length > 1 ? `${f.label} (${i + 1})` : f.label,
    fileUrl: fileUrl(file),
    fileName: file?.original_name || file?.name || '-'
  }))
}))
const step3Files = computed(() => [
  { key: 'power_of_attorney_file', label: '授权委托书' },
  { key: 'pp20_signed_file', label: 'PP.20 签字' },
  { key: 'dbd_signed_file', label: 'DBD 签字' },
].flatMap(f => {
  const files = toFileArray(data.step3?.[f.key])
  return files.map((file, i) => ({
    label: files.length > 1 ? `${f.label} (${i + 1})` : f.label,
    fileUrl: fileUrl(file),
    fileName: file?.original_name || file?.name || '-'
  }))
}))
const step4Files = computed(() => [
  { key: 'invoice_file', label: '商业发票' },
  { key: 'packing_list_file', label: '装箱单' },
].flatMap(f => {
  const files = toFileArray(data.step4?.[f.key])
  return files.map((file, i) => ({
    label: files.length > 1 ? `${f.label} (${i + 1})` : f.label,
    fileUrl: fileUrl(file),
    fileName: file?.original_name || file?.name || '-'
  }))
}))
const freightRows = computed(() => {
  const rows = []
  const cbm = data.finance?.freight_cbm; const kg = data.finance?.freight_kg
  if (cbm) rows.push({ label: cbm.fee_name || '按体积', amount: cbm.amount || 0, selected: cbm.selected })
  if (kg) rows.push({ label: kg.fee_name || '按重量', amount: kg.amount || 0, selected: kg.selected })
  return rows
})

onMounted(async () => {
  loading.value = true
  try {
    const [detailRes, tlRes] = await Promise.all([
      request.get(`/finance/client/tracking/${route.params.id}/detail`),
      request.get(`/finance/client/tracking/${route.params.id}/timeline`),
    ])
    Object.assign(data, detailRes.data)
    timeline.value = tlRes.data?.timeline || []
  } catch { /* */ }
  finally { loading.value = false }
  // 海关文件非阻塞加载
  request.get(`/finance/client/orders/${route.params.id}/customs-docs`).then(r => { customsDocs.value = r.data || [] }).catch(() => {})
})

function customsDocLabel(t) { return { customs_release: '海关放行单', tax_certificate: '关税缴纳凭证', other: '其他' }[t] || t }
function fileUrl(obj) {
  if (!obj) return ''
  let p = obj.url || ''
  if (!p) {
    const sp = obj.stored_path || ''
    const idx = sp.indexOf('/uploads/')
    p = idx >= 0 ? sp.substring(idx) : ''
  }
  return p
}
async function downloadInvoice(lang) {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`/api/finance/client/orders/${data.id}/invoice?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('下载失败')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice_${data.application_no || data.id}_${lang}.pdf`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    ElMessage.error('发票下载失败')
  }
}
function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }
.page-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
.top-info { flex: 1; }
.top-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
.top-app-no { font-size: 24px; font-weight: 700; color: #303133; letter-spacing: .5px; }
.top-meta-row { font-size: 15px; color: #606266; margin-bottom: 4px; }
.top-numbers { display: flex; gap: 20px; font-size: 16px; font-weight: 600; color: #E6A23C; margin-bottom: 4px; }
.top-time { font-size: 13px; color: #909399; }
.blocks { display: flex; flex-direction: column; gap: 14px; }
.block-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #303133; }
h4 { font-size: 14px; color: #606266; margin: 0 0 8px; }
.freight-note { margin-top: 8px; padding: 8px 12px; background: #ecf5ff; border-radius: 4px; color: #409EFF; font-weight: 600; text-align: center; }
.total-bar { margin-top: 14px; padding: 12px 16px; background: #f0f9eb; border-radius: 6px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; }
.total-bar span { font-size: 24px; color: #409EFF; }
.pay-block { display: flex; align-items: center; gap: 20px; padding: 22px 24px; border-radius: 10px; }
.pay-done { background: linear-gradient(135deg, #67C23A, #85CE61); }
.pay-pending { background: linear-gradient(135deg, #F56C6C, #F78989); }
.pay-icon-wrap { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pay-text { color: #fff; }
.pay-title { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.pay-amount { font-size: 22px; font-weight: 700; margin-bottom: 2px; }
.pay-time { font-size: 13px; opacity: .85; }
.balance-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #606266; }
.balance-row span:last-child { font-weight: 600; }
.balance-charge { border-top: 1px dashed #DCDFE6; padding-top: 8px; margin-top: 4px; }

@media (max-width: 768px) {
  .order-detail { padding: 0 4px; }
  .el-descriptions { font-size: 12px; }
  .el-row { margin-left: 0 !important; margin-right: 0 !important; }
  .el-col { padding-left: 0 !important; padding-right: 0 !important; margin-bottom: 8px; }
}
</style>
