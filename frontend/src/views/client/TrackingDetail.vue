<template>
  <div class="detail-page" v-loading="loading">
    <!-- 顶部 -->
    <div class="page-top">
      <el-button text @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <div class="top-info" v-if="data.id">
        <div class="top-title-row">
          <span class="top-app-no">{{ data.application_no || '订单 #' + data.id }}</span>
          <el-tag :color="statusInfo.color" :type="statusInfo.tagType" size="large" effect="dark" style="font-size:15px">
            {{ statusInfo.label }}
          </el-tag>
        </div>
        <div class="top-meta-row">
          <span v-if="data.step1?.thai_name || data.step1?.english_name">
            {{ data.step1.thai_name || data.step1.english_name }}
          </span>
        </div>
        <div class="top-numbers">
          <span v-if="data.step1?.tariff_rate">关税 {{ data.step1.tariff_rate }}</span>
          <span>运费 {{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</span>
        </div>
        <div class="top-time">提交于 {{ fmt(data.created_at) }}</div>
      </div>
    </div>

    <!-- 收货仓库地址 -->
    <el-alert v-if="warehouse" type="info" :closable="false" show-icon style="margin-bottom:16px">
      <template #title><span style="font-weight:700">收货仓库地址 — 请自行发货至以下地址</span></template>
      <div class="warehouse-info">
        <div><strong>{{ warehouse.name }}</strong></div>
        <div>{{ warehouse.address }}</div>
        <div>联系人：{{ warehouse.contact_person }}　电话：{{ warehouse.contact_phone }}</div>
        <div v-if="warehouse.notes" style="color:#909399;font-size:12px;margin-top:4px">{{ warehouse.notes }}</div>
      </div>
    </el-alert>

    <!-- 发货信息 -->
    <el-card v-if="data.tracking_status >= 2" shadow="never" class="ship-card">
      <template #header><div class="block-title"><el-icon><Ship /></el-icon> 发货信息</div></template>
      <template v-if="data.tracking_number">
        <el-result icon="success" title="已发货" :sub-title="'快递公司: ' + (data.tracking_company || '-') + ' | 运单号: ' + data.tracking_number">
          <template #extra>
            <el-button type="primary" size="small" @click="copyTracking">复制运单号</el-button>
          </template>
        </el-result>
      </template>
      <template v-else>
        <div style="text-align:center;padding:12px">
          <p style="color:#909399;margin-bottom:12px">您已审核通过，请尽快发货至上方仓库地址</p>
          <el-button type="warning" size="default" @click="showShipForm = true"><el-icon><Upload /></el-icon> 我已发货，填写运单号</el-button>
        </div>
        <el-dialog v-model="showShipForm" title="填写发货信息" width="400px" :close-on-click-modal="false">
          <el-form label-width="100px">
            <el-form-item label="快递公司" required><el-input v-model="shipForm.company" placeholder="如：顺丰速运" /></el-form-item>
            <el-form-item label="运单号" required><el-input v-model="shipForm.number" placeholder="请输入运单号" /></el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showShipForm = false">取消</el-button>
            <el-button type="primary" :loading="shipLoading" @click="submitShipping">确认发货</el-button>
          </template>
        </el-dialog>
      </template>
    </el-card>

    <div v-if="data.id" class="blocks">
      <!-- 区块一：产品信息 -->
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

      <!-- 区块二：公司信息 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Office /></el-icon> 公司信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="公司名称">{{ data.step2?.company_name || data.client_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="泰国地址">{{ data.step2?.thai_address || '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 style="margin-top:12px">公司文件</h4>
        <el-table :data="step2Files" size="small" stripe>
          <el-table-column prop="label" label="文件类型" width="140" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{row}">
              <el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link>
              <span v-else style="color:#c0c4cc">未上传</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 区块三：报关授权 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Lock /></el-icon> 报关授权</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="授权类型">
            <el-tag :type="data.step3?.handler_type==='director'?'success':'warning'" size="small">{{ data.step3?.handler_type==='director'?'董事本人办理':'委托办理' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="报关账号">{{ data.step3?.account_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报关密码">{{ data.step3?.password ? '******' : '-' }}</el-descriptions-item>
          <el-descriptions-item label="护照原件">{{ data.step3?.has_director_passport_original ? '已提供' : '未确认' }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="data.step3?.handler_type==='agent'">
          <h4 style="margin-top:12px">委托文件</h4>
          <el-table :data="step3Files" size="small" stripe>
            <el-table-column prop="label" label="文件类型" width="140" />
            <el-table-column label="文件名" min-width="250">
              <template #default="{row}">
                <el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link>
                <span v-else style="color:#c0c4cc">未上传</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-card>

      <!-- 区块四：退税信息 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Tickets /></el-icon> 退税信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="退税方案">
            <el-tag :type="data.step4?.need_rebate?'warning':'info'" size="small">{{ data.step4?.need_rebate?'需要退税':'无需退税（货代）' }}</el-tag>
          </el-descriptions-item>
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
            <template #default="{row}">
              <el-link v-if="row.fileUrl" type="primary" :href="row.fileUrl" target="_blank">{{ row.fileName }}</el-link>
              <span v-else style="color:#c0c4cc">未上传</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 区块四点五：许可证上传 -->
      <el-card v-if="data.license_type" shadow="never">
        <template #header>
          <div class="block-title">
            <el-icon><Document /></el-icon>
            许可证上传 — {{ data.license_type }}
          </div>
        </template>
        <p style="color:#909399;margin-bottom:12px">该订单需要办理 {{ data.license_type }} 许可证，请上传对应的证件文件</p>
        <el-upload
          :action="'/api/finance/client/submissions/' + data.id + '/upload-license'"
          :headers="uploadHeaders"
          :data="{ license_type: data.license_type, stage: 1 }"
          :on-success="onLicenseUploaded"
          :before-upload="beforeUpload"
          accept="image/*,.pdf"
          :show-file-list="false"
        >
          <el-button type="primary" :loading="uploading"><el-icon><Upload /></el-icon> 上传 {{ data.license_type }} 证件</el-button>
        </el-upload>
        <el-table v-if="licenseDocs.length > 0" :data="licenseDocs" size="small" style="margin-top:12px">
          <el-table-column prop="file_name" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="license_type" label="类型" width="80" />
          <el-table-column label="操作" width="80">
            <template #default="{row}">
              <el-link type="primary" :href="row.url || (row.file_path && row.file_path.startsWith('/') ? row.file_path : '/uploads' + row.file_path)" target="_blank">查看</el-link>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 区块五：发货信息 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Ship /></el-icon> 发货信息</div></template>
        <el-descriptions v-if="data.tracking_company" :column="2" border size="small">
          <el-descriptions-item label="快递公司">{{ data.tracking_company || '-' }}</el-descriptions-item>
          <el-descriptions-item label="运单号">{{ data.tracking_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ fmt(data.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item label="到仓时间">{{ fmt(data.arrived_at_warehouse) }}</el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="未发货" :image-size="60" />
      </el-card>

      <!-- 区块六：费用明细 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Money /></el-icon> 费用明细</div></template>
        <!-- 国际运费 -->
        <h4>国际运费</h4>
        <el-table :data="freightRows" size="small" stripe>
          <el-table-column prop="label" label="计费方式" min-width="240" />
          <el-table-column label="金额" width="140">
            <template #default="{row}">
              <span :style="{fontWeight:row.selected?'700':'400',color:row.selected?'#67C23A':'#909399'}">
                {{ row.amount }} ฿ <el-tag v-if="row.selected" size="small" type="success">采纳</el-tag>
              </span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="data.finance?.freight_max_note" class="freight-note">{{ data.finance.freight_max_note }}</div>

        <!-- 境内运费 -->
        <h4 style="margin-top:14px">境内运费</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="物流公司">{{ data.finance?.domestic_logistics_name || '未选择' }}</el-descriptions-item>
          <el-descriptions-item label="金额">{{ data.finance?.domestic_freight?.amount || 0 }} ฿</el-descriptions-item>
        </el-descriptions>

        <!-- 仓储费 -->
        <h4 style="margin-top:14px">仓储费</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="仓储天数">{{ data.finance?.storage_days || 0 }} 天</el-descriptions-item>
          <el-descriptions-item label="金额">{{ data.finance?.storage?.amount || 0 }} ฿</el-descriptions-item>
        </el-descriptions>

        <!-- 附加服务 -->
        <template v-if="(data.finance?.services||[]).length">
          <h4 style="margin-top:14px">附加服务</h4>
          <el-table :data="data.finance.services" size="small" stripe>
            <el-table-column prop="fee_name" label="服务项目" min-width="200" />
            <el-table-column label="金额" width="120"><template #default="{row}">{{ row.amount }} ฿</template></el-table-column>
            <el-table-column label="状态" width="70"><template #default="{row}"><el-tag :type="row.selected?'success':'info'" size="small">{{ row.selected?'已选':'未选' }}</el-tag></template></el-table-column>
          </el-table>
        </template>

        <div class="total-bar">费用总计 <span>{{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</span></div>
      </el-card>

      <!-- 区块七：付款状态 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Coin /></el-icon> 付款状态</div></template>
        <!-- 已付款 -->
        <div v-if="data.finance?.charge_log?.status==='charged'" class="pay-block pay-done">
          <div class="pay-icon-wrap"><el-icon :size="48" color="#fff"><CircleCheckFilled /></el-icon></div>
          <div class="pay-text">
            <div class="pay-title">已付款</div>
            <div class="pay-amount">扣款 {{ (data.finance.charge_log.total_amount || 0).toLocaleString() }} ฿</div>
            <div class="pay-time">扣款时间：{{ fmt(data.finance.charge_log.charged_at) }}</div>
          </div>
        </div>
        <!-- 待付款（未到状态7） -->
        <div v-else-if="(data.tracking_status || 1) < 7" class="pay-block pay-pending">
          <div class="pay-icon-wrap"><el-icon :size="48" color="#fff"><Clock /></el-icon></div>
          <div class="pay-text">
            <div class="pay-title">待付款</div>
            <div class="pay-amount">应付 {{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</div>
            <div class="pay-time">货物到达泰国仓库时自动扣款</div>
          </div>
        </div>
        <!-- 扣款失败 -->
        <div v-else class="pay-block pay-failed">
          <div class="pay-icon-wrap"><el-icon :size="48" color="#fff"><WarningFilled /></el-icon></div>
          <div class="pay-text">
            <div class="pay-title">扣款失败</div>
            <div class="pay-amount">应付 {{ (data.finance?.total_amount || 0).toLocaleString() }} ฿</div>
            <div class="pay-time">余额不足，请联系客户充值后重新扣款</div>
          </div>
        </div>
      </el-card>

      <!-- 区块八：状态时间线 -->
      <el-card shadow="never"><template #header><div class="block-title"><el-icon><Timer /></el-icon> 状态时间线</div></template>
        <el-timeline v-if="timeline.length > 0">
          <el-timeline-item
            v-for="(t,i) in timeline" :key="i"
            :timestamp="fmt(t.time)" placement="top"
            :color="t.color"
            :hollow="i > 0"
          >
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
import { getTrackingStatus } from '@/utils/tracking'
import { CircleCheckFilled, WarningFilled, Clock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const route = useRoute()
const loading = ref(false)
const data = reactive({})
const uploadHeaders = computed(() => ({ Authorization: 'Bearer ' + localStorage.getItem('token') }))
const timeline = ref([])
const warehouse = ref(null)
const showShipForm = ref(false)
const uploading = ref(false)
const licenseDocs = ref([])
const shipLoading = ref(false)
const shipForm = ref({ company: '', number: '' })

async function submitShipping() {
  if (!shipForm.value.company || !shipForm.value.number) return
  shipLoading.value = true
  try {
    await request.put(`/finance/client/submissions/${route.params.id}/shipping-info`, {
      tracking_company: shipForm.value.company,
      tracking_number: shipForm.value.number,
    })
    showShipForm.value = false
    data.tracking_company = shipForm.value.company
    data.tracking_number = shipForm.value.number
    data.shipped_at = new Date().toISOString()
  } catch { /* */ }
  finally { shipLoading.value = false }
}

function copyTracking() {
  navigator.clipboard.writeText(data.tracking_number || '')
  ElMessage.success('已复制')
}

const statusInfo = computed(() => getTrackingStatus(data.tracking_status))

const step1Images = computed(() => {
  const imgs = data.step1?.product_images || []
  return Array.isArray(imgs) ? imgs : []
})

const step2Files = computed(() => [
  { label: 'DBD 文件', fileUrl: fileUrl(data.step2?.dbd_file), fileName: data.step2?.dbd_file?.original_name },
  { label: 'PP.20 文件', fileUrl: fileUrl(data.step2?.pp20_file), fileName: data.step2?.pp20_file?.original_name },
  { label: '公司印章', fileUrl: fileUrl(data.step2?.company_stamp_file), fileName: data.step2?.company_stamp_file?.original_name },
  { label: '法人护照', fileUrl: fileUrl(data.step2?.director_passport_file), fileName: data.step2?.director_passport_file?.original_name },
])

const step3Files = computed(() => [
  { label: '授权委托书', fileUrl: fileUrl(data.step3?.power_of_attorney_file), fileName: data.step3?.power_of_attorney_file?.original_name },
  { label: 'PP.20 签字', fileUrl: fileUrl(data.step3?.pp20_signed_file), fileName: data.step3?.pp20_signed_file?.original_name },
  { label: 'DBD 签字', fileUrl: fileUrl(data.step3?.dbd_signed_file), fileName: data.step3?.dbd_signed_file?.original_name },
])

const step4Files = computed(() => [
  { label: '商业发票', fileUrl: fileUrl(data.step4?.invoice_file), fileName: data.step4?.invoice_file?.original_name },
  { label: '装箱单', fileUrl: fileUrl(data.step4?.packing_list_file), fileName: data.step4?.packing_list_file?.original_name },
])

const freightRows = computed(() => {
  const rows = []
  const cbm = data.finance?.freight_cbm
  const kg = data.finance?.freight_kg
  if (cbm) rows.push({ label: cbm.fee_name || '按体积', amount: cbm.amount || 0, selected: cbm.selected })
  if (kg) rows.push({ label: kg.fee_name || '按重量', amount: kg.amount || 0, selected: kg.selected })
  return rows
})

async function onLicenseUploaded(res) {
  if (res.code === 200) {
    ElMessage.success('上传成功')
    loadLicenseDocs()
  }
}

function beforeUpload(file) {
  const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf']
  if (!allowed.includes(file.type)) {
    ElMessage.error('仅支持图片和PDF格式')
    return false
  }
  if (file.size > 20 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过20MB')
    return false
  }
  uploading.value = true
  return true
}

async function loadLicenseDocs() {
  try {
    const res = await request.get('/finance/client/submissions/' + data.id + '/license-docs')
    licenseDocs.value = res.data || []
  } catch { licenseDocs.value = [] }
}

onMounted(async () => {
  loading.value = true
  try {
    const [detailRes, tlRes] = await Promise.all([
      request.get(`/finance/client/tracking/${route.params.id}/detail`),
      request.get(`/finance/client/tracking/${route.params.id}/timeline`),
    ])
    Object.assign(data, detailRes.data)
    timeline.value = tlRes.data?.timeline || []
    // 根据路线获取仓库
    const routeParam = data.international_route || ''
    const whRes = await request.get('/finance/warehouses', { params: { route: routeParam } }).catch(() => ({ data: null }))
    warehouse.value = whRes.data || null
  } catch { /* */ }
  finally { loading.value = false }
  loadLicenseDocs()
})

function fileUrl(obj) {
  if (!obj) return ''
  let p = obj.url || ''
  // 新数据：url 是相对路径如 /uploads/1/1/file.jpg
  if (!p) {
    // 旧数据：stored_path 是文件系统绝对路径，提取 /uploads/ 后面的部分
    const sp = obj.stored_path || ''
    const idx = sp.indexOf('/uploads/')
    p = idx >= 0 ? sp.substring(idx) : ''
  }
  if (!p) return ''
  return p
}
function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.detail-page { max-width: 900px; margin: 0 auto; padding-bottom: 40px; }
.page-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
.top-info { flex: 1; }
.top-title-row { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
.top-app-no { font-size: 24px; font-weight: 700; color: #303133; letter-spacing: .5px; }
.top-meta-row { display: flex; align-items: center; gap: 16px; font-size: 15px; color: #606266; margin-bottom: 4px; }
.top-numbers { display: flex; gap: 20px; font-size: 16px; font-weight: 600; color: #E6A23C; margin-bottom: 4px; }
.top-time { font-size: 13px; color: #909399; }
.warehouse-info { font-size: 14px; line-height: 1.8; color: #303133; }
.warehouse-info strong { font-size: 15px; }
.blocks { display: flex; flex-direction: column; gap: 14px; }
.block-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #303133; }
h4 { font-size: 14px; color: #606266; margin: 0 0 8px; }
.freight-note { margin-top: 8px; padding: 8px 12px; background: #ecf5ff; border-radius: 4px; color: #409EFF; font-weight: 600; text-align: center; }
.total-bar { margin-top: 14px; padding: 12px 16px; background: #f0f9eb; border-radius: 6px; display: flex; justify-content: space-between; font-size: 16px; font-weight: 600; }
.total-bar span { font-size: 24px; color: #409EFF; }
.pay-block { display: flex; align-items: center; gap: 24px; padding: 28px 32px; border-radius: 12px; }
.pay-done { background: linear-gradient(135deg, #67C23A, #85CE61); }
.pay-pending { background: linear-gradient(135deg, #E6A23C, #EBB563); }
.pay-failed { background: linear-gradient(135deg, #F56C6C, #F78989); }
.pay-icon-wrap { width: 72px; height: 72px; border-radius: 50%; background: rgba(255,255,255,.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pay-text { color: #fff; }
.pay-title { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
.pay-amount { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
.pay-time { font-size: 14px; opacity: .85; }
</style>
