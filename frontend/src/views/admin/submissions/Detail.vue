<template>
  <div class="admin-detail" v-loading="loading">
    <div class="detail-header">
      <el-button text @click="$router.push('/admin/submissions')"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>
      <div class="header-info">
        <h2>申请详情 {{ data.application_no ? '#' + data.application_no : '' }}</h2>
        <el-tag :type="statusTag(data.review_status)" size="small" effect="dark">
          {{ statusLabel(data.review_status) }}
        </el-tag>
        <span class="header-meta">客户: {{ data.client_name }} | 提交: {{ formatDate(data.created_at) }}</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="产品信息" name="step1">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="泰文名称">{{ step1?.thai_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="英文名称">{{ step1?.english_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="HS Code">{{ step1?.hs_code || '未确认' }}</el-descriptions-item>
          <el-descriptions-item label="关税税率">{{ step1?.tariff_rate || '未确认' }}</el-descriptions-item>
          <el-descriptions-item label="Form E">{{ step1?.form_e_eligible ? '可用' : '不可用/未确认' }}</el-descriptions-item>
          <el-descriptions-item label="许可证">{{ step1?.license_required ? '需要' : '无需/未确认' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="公司资料" name="step2">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="泰国地址" :span="2">{{ step2?.thai_address || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="12" style="margin-top:12px">
          <el-col :span="6" v-for="f in step2Files" :key="f.label">
            <el-card shadow="hover" class="file-card"><div class="file-label">{{ f.label }}</div><div v-if="f.file?.original_name" class="file-ok"><el-icon color="#67C23A"><CircleCheckFilled /></el-icon>{{ f.file.original_name }}</div><div v-else class="file-none">未上传</div></el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="报关授权" name="step3">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="办理方式"><el-tag :type="step3?.handler_type==='director'?'success':'warning'" size="small">{{ step3?.handler_type==='director'?'董事本人办理':'委托办理' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="护照原件">{{ step3?.has_director_passport_original?'已提供':'未确认' }}</el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="12" style="margin-top:12px" v-if="step3?.handler_type === 'agent'">
          <el-col :span="8" v-for="f in step3Files" :key="f.label"><el-card shadow="hover" class="file-card"><div class="file-label">{{ f.label }}</div><div v-if="f.file?.original_name" class="file-ok"><el-icon color="#67C23A"><CircleCheckFilled /></el-icon>{{ f.file.original_name }}</div><div v-else class="file-none">未上传</div></el-card></el-col>
        </el-row>
      </el-tab-pane>
      <el-tab-pane label="退税信息" name="step4">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="退税方案"><el-tag :type="step4?.need_rebate?'warning':'info'" size="small">{{ step4?.need_rebate?'需要退税':'无需退税' }}</el-tag></el-descriptions-item>
          <template v-if="step4?.need_rebate">
            <el-descriptions-item label="报关公司">{{ step4?.customs_company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流对接">{{ step4?.logistics_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物流编码">{{ step4?.logistics_code || '-' }}</el-descriptions-item>
          </template>
          <template v-else>
            <el-descriptions-item label="商业发票">{{ step4?.invoice_file?.original_name || '未上传' }}</el-descriptions-item>
            <el-descriptions-item label="装箱单">{{ step4?.packing_list_file?.original_name || '未上传' }}</el-descriptions-item>
          </template>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="发货信息" name="step5">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="确认发货"><el-tag :type="step5?.confirmed?'success':'info'" size="small">{{ step5?.confirmed?'已确认':'待确认' }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="运单号">{{ step5?.tracking_number||'-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ formatDate(step5?.shipped_at) }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>

    <!-- 审核信息 -->
    <el-card class="review-info" shadow="hover">
      <template #header><span><el-icon><InfoFilled /></el-icon> 审核信息</span></template>
      <el-descriptions :column="2" size="small">
        <el-descriptions-item label="审核状态"><el-tag :type="statusTag(data.review_status)" size="small">{{ statusLabel(data.review_status) }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="审核意见">{{ data.review_comment || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Next 账号">{{ data.next_account || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册状态">{{ data.next_register_status || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSubmissionDetail } from '@/api/admin'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const activeTab = ref('step1')
const data = reactive({})

const step1 = computed(() => data.step1 || {})
const step2 = computed(() => data.step2 || {})
const step3 = computed(() => data.step3 || {})
const step4 = computed(() => data.step4 || {})
const step5 = computed(() => data.step5 || {})
const step2Files = computed(() => [{label:'DBD',file:step2.value.dbd_file},{label:'PP.20',file:step2.value.pp20_file},{label:'公司印章',file:step2.value.company_stamp_file},{label:'董事护照',file:step2.value.director_passport_file}])
const step3Files = computed(() => [{label:'授权委托书',file:step3.value.power_of_attorney_file},{label:'PP.20签字',file:step3.value.pp20_signed_file},{label:'DBD签字',file:step3.value.dbd_signed_file}])

onMounted(() => loadDetail())
async function loadDetail() {
  loading.value = true
  try { const res = await getSubmissionDetail(route.params.id); Object.assign(data, res.data) }
  catch { router.push('/admin/submissions') }
  finally { loading.value = false }
}
function statusTag(s) { return s==='approved'?'success':s==='rejected'?'danger':s==='registered'?'':'warning' }
function statusLabel(s) { return s==='approved'?'审核通过':s==='rejected'?'已退回':s==='registered'?'已注册':'审核中' }
function formatDate(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style lang="scss" scoped>
.admin-detail { max-width: 1000px; margin: 0 auto; }
.detail-header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px; .header-info { h2 { margin:0 0 4px; font-size:20px; } .header-meta { display:block; color:#909399; font-size:13px; margin-top:4px; } .el-tag { margin-left:10px; } } }
.file-card { text-align:center; .file-label { font-size:13px; color:#909399; margin-bottom:8px; } .file-ok { color:#67C23A; font-size:12px; display:flex; align-items:center; gap:4px; justify-content:center; } .file-none { color:#c0c4cc; font-size:12px; } }
.review-info { margin-top: 20px; }
</style>
