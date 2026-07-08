<template>
  <div class="export-page" v-loading="loading">
    <!-- 顶部 -->
    <div class="page-header">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>资料导出汇总 {{ data.application_no ? '#' + data.application_no : '' }}</h2>
      <el-tag :type="statusTag(data.review_status)" size="large">{{ statusLabel(data.review_status) }}</el-tag>
    </div>

    <div v-if="data.id" class="export-content">
      <!-- 基本信息卡片 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><InfoFilled /></el-icon> 基本信息</div></template>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="申请编号">{{ data.application_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ data.client_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户邮箱">{{ data.client_email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ fmt(data.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ fmt(data.review_at) }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">{{ statusLabel(data.review_status) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 第一区：产品信息 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Goods /></el-icon> 一、产品信息</div></template>
        <h4 class="sub-header">客户填写</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="产品泰文名称">{{ data.step1?.thai_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品英文名称">{{ data.step1?.english_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品描述">{{ data.step1?.license_notes || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品图片" :span="2">
            <template v-if="step1Images.length">
              <el-image v-for="(img, i) in step1Images" :key="i" :src="fileUrl(img)" style="width:80px;height:80px;margin-right:8px" fit="cover" :preview-src-list="step1Images.map(f => fileUrl(f))" />
            </template>
            <span v-else>无</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="sub-header" style="margin-top:16px">员工确认</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="HS Code">{{ data.step1?.hs_code || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关税税率">{{ data.step1?.tariff_rate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="是否可用 Form E">
            <el-tag :type="data.step1?.form_e_eligible ? 'success' : 'info'" size="small">{{ data.step1?.form_e_eligible ? '可用' : '不可用' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否需要许可证">
            <el-tag :type="data.step1?.license_required ? 'danger' : 'info'" size="small">{{ data.step1?.license_required ? '需要' : '不需要' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 第二区：公司资料 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Office /></el-icon> 二、公司资料</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="公司名称">{{ data.step2?.company_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="泰国地址">{{ data.step2?.thai_address || '-' }}</el-descriptions-item>
        </el-descriptions>
        <h4 class="sub-header" style="margin-top:16px">已上传文件</h4>
        <el-table :data="step2FileList" size="small" stripe>
          <el-table-column prop="label" label="文件类型" width="160" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{row}">
              <template v-if="row.fileUrl">
                <el-link type="primary" :href="row.fileUrl" target="_blank" :underline="false">
                  <el-icon><Link /></el-icon> {{ row.fileName }}
                </el-link>
              </template>
              <span v-else style="color:#c0c4cc">未上传</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 第三区：报关授权 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Lock /></el-icon> 三、报关授权</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="授权类型">
            <el-tag :type="data.step3?.handler_type === 'director' ? 'success' : 'warning'" size="small">
              {{ data.step3?.handler_type === 'director' ? '董事本人办理' : '委托办理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="护照原件">{{ data.step3?.has_director_passport_original ? '已提供' : '未确认' }}</el-descriptions-item>
          <el-descriptions-item label="报关账号">{{ data.step3?.account_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报关密码">{{ data.step3?.password ? '******' : '-' }}</el-descriptions-item>
        </el-descriptions>
        <template v-if="data.step3?.handler_type === 'agent'">
          <h4 class="sub-header" style="margin-top:16px">委托文件</h4>
          <el-table :data="step3FileList" size="small" stripe>
            <el-table-column prop="label" label="文件类型" width="160" />
            <el-table-column label="文件名" min-width="250">
              <template #default="{row}">
                <template v-if="row.fileUrl">
                  <el-link type="primary" :href="row.fileUrl" target="_blank" :underline="false">
                    <el-icon><Link /></el-icon> {{ row.fileName }}
                  </el-link>
                </template>
                <span v-else style="color:#c0c4cc">未上传</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-card>

      <!-- 第四区：退税信息 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Tickets /></el-icon> 四、退税信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="退税方案">
            <el-tag :type="data.step4?.need_rebate ? 'warning' : 'info'" size="small">
              {{ data.step4?.need_rebate ? '需要退税' : '无需退税（货代）' }}
            </el-tag>
          </el-descriptions-item>
          <template v-if="data.step4?.need_rebate">
            <el-descriptions-item label="报关公司">{{ data.step4?.customs_company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流对接人">{{ data.step4?.logistics_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流编码">{{ data.step4?.logistics_code || '-' }}</el-descriptions-item>
          </template>
        </el-descriptions>
        <h4 class="sub-header" style="margin-top:16px">相关文件</h4>
        <el-table :data="step4FileList" size="small" stripe>
          <el-table-column prop="label" label="文件类型" width="160" />
          <el-table-column label="文件名" min-width="250">
            <template #default="{row}">
              <template v-if="row.fileUrl">
                <el-link type="primary" :href="row.fileUrl" target="_blank" :underline="false">
                  <el-icon><Link /></el-icon> {{ row.fileName }}
                </el-link>
              </template>
              <span v-else style="color:#c0c4cc">未上传</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 第五区：发货信息 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Ship /></el-icon> 五、发货信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="确认发货">
            <el-tag :type="data.step5?.confirmed ? 'success' : 'info'" size="small">{{ data.step5?.confirmed ? '已确认' : '待确认' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="运单号">{{ data.step5?.tracking_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ fmt(data.step5?.shipped_at) }}</el-descriptions-item>
          <el-descriptions-item label="到仓时间">{{ fmt(data.arrived_at_warehouse) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 第六区：费用信息 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Money /></el-icon> 六、费用信息</div></template>

        <!-- 国际运费 -->
        <h4 class="sub-header">国际运费</h4>
        <el-table :data="freightTableData" size="small" stripe>
          <el-table-column prop="label" label="计费方式" min-width="220" />
          <el-table-column label="金额" width="160">
            <template #default="{row}">
              <span :style="{ fontWeight: row.isSelected ? '700' : '400', color: row.isSelected ? '#67C23A' : '#909399' }">
                {{ row.amount }} ฿
                <el-tag v-if="row.isSelected" size="small" type="success" style="margin-left:4px">采纳</el-tag>
              </span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="data.finance?.freight_max_note" class="freight-note">{{ data.finance.freight_max_note }}</div>

        <!-- 境内运费 -->
        <h4 class="sub-header" style="margin-top:16px">境内运费</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="物流公司">{{ data.finance?.domestic_logistics_name || '未选择' }}</el-descriptions-item>
          <el-descriptions-item label="境内运费">{{ data.finance?.domestic_freight?.amount || 0 }} ฿</el-descriptions-item>
        </el-descriptions>

        <!-- 仓储费 -->
        <h4 class="sub-header" style="margin-top:16px">仓储费</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="仓储天数">{{ data.finance?.storage_days || 0 }} 天</el-descriptions-item>
          <el-descriptions-item label="仓储费">{{ data.finance?.storage?.amount || 0 }} ฿</el-descriptions-item>
        </el-descriptions>

        <!-- 附加服务 -->
        <h4 class="sub-header" style="margin-top:16px">附加服务</h4>
        <el-table v-if="(data.finance?.services||[]).length" :data="data.finance.services" size="small" stripe>
          <el-table-column prop="fee_name" label="服务项目" min-width="200" />
          <el-table-column label="数量" width="80"><template #default="{row}">{{ row.quantity }}</template></el-table-column>
          <el-table-column label="单价" width="110"><template #default="{row}">{{ row.unit_price }} ฿</template></el-table-column>
          <el-table-column label="金额" width="120"><template #default="{row}">{{ row.amount }} ฿</template></el-table-column>
          <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.selected ? 'success' : 'info'" size="small">{{ row.selected ? '已选' : '未选' }}</el-tag></template></el-table-column>
        </el-table>
        <div v-else class="empty-hint">无附加服务</div>

        <!-- 海关关税（代垫费用） -->
        <div v-if="(data.customs_duty_amount || 0) > 0" class="customs-duty-bar">
          <span>海关关税（代垫费用）</span>
          <span style="font-weight:700;color:#E6A23C;font-size:15px">{{ (data.customs_duty_amount || 0).toLocaleString() }} ฿</span>
        </div>

        <!-- 总计和扣款 -->
        <div class="total-bar">
          <span>总费用</span>
          <span class="total-amount">{{ ((data.finance?.total_amount || 0) + (data.customs_duty_amount || 0)).toLocaleString() }} ฿</span>
        </div>
        <div v-if="data.finance?.charge_log">
          <el-alert v-if="data.finance.charge_log.status === 'charged'" type="success" :closable="false" show-icon title="已扣款" :description="'扣款金额: ' + (data.finance.charge_log.total_amount || 0) + ' ฿，时间: ' + fmt(data.finance.charge_log.charged_at)" style="margin-top:8px" />
          <el-alert v-if="data.finance.charge_log.status === 'refunded'" type="warning" :closable="false" show-icon title="已退款" :description="'退款金额: ' + (data.finance.charge_log.total_amount || 0) + ' ฿'" style="margin-top:8px" />
        </div>
      </el-card>

      <!-- 第七区：Next注册信息 -->
      <el-card class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><Connection /></el-icon> 七、Next注册信息</div></template>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="Next注册账号">{{ data.next?.next_account || '未注册' }}</el-descriptions-item>
          <el-descriptions-item label="注册状态">
            <el-tag v-if="data.next?.next_register_status === 'success'" type="success" size="small">注册成功</el-tag>
            <el-tag v-else-if="data.next?.next_register_status === 'failed'" type="danger" size="small">注册失败</el-tag>
            <el-tag v-else-if="data.next?.next_register_status === 'pending'" type="warning" size="small">注册中</el-tag>
            <span v-else style="color:#c0c4cc">未注册</span>
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ fmt(data.next?.registered_at) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 全部文件汇总 -->
      <el-card v-if="data.files?.length" class="section-card" shadow="never">
        <template #header><div class="section-title"><el-icon><FolderOpened /></el-icon> 全部文件（{{ data.files.length }}个）</div></template>
        <el-table :data="data.files" size="small" stripe>
          <el-table-column label="阶段" width="100">
            <template #default="{row}">{{ stageLabel(row.stage) }}</template>
          </el-table-column>
          <el-table-column prop="original_name" label="文件名" min-width="280" show-overflow-tooltip />
          <el-table-column label="操作" width="100">
            <template #default="{row}">
              <template v-if="row.stored_path">
                <el-link type="primary" :href="fileUrl(row)" target="_blank" :underline="false">下载/预览</el-link>
              </template>
              <span v-else style="color:#c0c4cc">-</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <div v-else-if="!loading" class="empty-page">
      <el-empty description="未找到数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getExportData } from '@/api/employee'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const data = reactive({})

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res = await getExportData(route.params.id)
    Object.assign(data, res.data)
  } catch {
    ElMessage.error('加载失败')
    router.back()
  }
  finally { loading.value = false }
}

// 产品图片
const step1Images = computed(() => {
  const imgs = data.step1?.product_images || []
  return Array.isArray(imgs) ? imgs : []
})

// 公司资料文件列表
const step2FileList = computed(() => [
  { label: 'DBD 文件', fileUrl: fileUrl(data.step2?.dbd_file), fileName: data.step2?.dbd_file?.original_name },
  { label: 'PP.20 文件', fileUrl: fileUrl(data.step2?.pp20_file), fileName: data.step2?.pp20_file?.original_name },
  { label: '公司印章', fileUrl: fileUrl(data.step2?.company_stamp_file), fileName: data.step2?.company_stamp_file?.original_name },
  { label: '法人护照', fileUrl: fileUrl(data.step2?.director_passport_file), fileName: data.step2?.director_passport_file?.original_name },
])

const step3FileList = computed(() => [
  { label: '授权委托书', fileUrl: fileUrl(data.step3?.power_of_attorney_file), fileName: data.step3?.power_of_attorney_file?.original_name },
  { label: 'PP.20 签字', fileUrl: fileUrl(data.step3?.pp20_signed_file), fileName: data.step3?.pp20_signed_file?.original_name },
  { label: 'DBD 签字', fileUrl: fileUrl(data.step3?.dbd_signed_file), fileName: data.step3?.dbd_signed_file?.original_name },
])

const step4FileList = computed(() => [
  { label: '商业发票', fileUrl: fileUrl(data.step4?.invoice_file), fileName: data.step4?.invoice_file?.original_name },
  { label: '装箱单', fileUrl: fileUrl(data.step4?.packing_list_file), fileName: data.step4?.packing_list_file?.original_name },
])

// 国际运费对比表
const freightTableData = computed(() => {
  const rows = []
  const cbm = data.finance?.freight_cbm
  const kg = data.finance?.freight_kg
  if (cbm) rows.push({ label: cbm.fee_name || '按体积计费', amount: cbm.amount || 0, isSelected: cbm.selected })
  if (kg) rows.push({ label: kg.fee_name || '按重量计费', amount: kg.amount || 0, isSelected: kg.selected })
  return rows
})

function fileUrl(fileObj) {
  if (!fileObj) return ''
  let p = fileObj.url || ''
  if (!p) {
    const sp = fileObj.stored_path || ''
    const idx = sp.indexOf('/uploads/')
    p = idx >= 0 ? sp.substring(idx) : ''
  }
  if (!p) return ''
  return p
}

function fmt(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

function stageLabel(s) {
  return ({ 1: '产品信息', 2: '公司资料', 3: '报关授权', 4: '退税信息', 5: '发货信息' })[s] || `阶段${s}`
}

function statusTag(s) {
  return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : s === 'registered' ? '' : 'warning'
}

function statusLabel(s) {
  return s === 'approved' ? '审核通过' : s === 'rejected' ? '已退回' : s === 'registered' ? '已注册' : '待审核'
}
</script>

<style lang="scss" scoped>
.export-page { max-width: 960px; margin: 0 auto; padding-bottom: 40px; }
.page-header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
  h2 { margin: 0; font-size: 20px; }
}
.export-content { display: flex; flex-direction: column; gap: 16px; }
.section-card {
  :deep(.el-card__header) { padding: 12px 16px; background: #fafafa; }
}
.section-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #303133; }
.sub-header { margin: 0 0 12px; font-size: 14px; color: #606266; font-weight: 600; }
.freight-note {
  margin-top: 8px; padding: 8px 12px; background: #ecf5ff; border-radius: 4px;
  color: #409EFF; font-weight: 600; text-align: center; font-size: 14px;
}
.total-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 16px; padding: 12px 16px; background: #f0f9eb; border-radius: 6px;
  font-size: 16px; font-weight: 600; color: #303133;
  .total-amount { font-size: 24px; color: #409EFF; }
}
.empty-hint { color: #c0c4cc; font-size: 13px; text-align: center; padding: 12px; }
.empty-page { padding: 60px 0; }
.customs-duty-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
  margin-top: 16px;
}
</style>
