<template>
  <div class="step5-forecast">
    <div class="step-title">
      <el-icon :size="20" color="#409EFF"><Ship /></el-icon>
      <span>预报单</span>
    </div>
    <p class="step-desc">
      请填写预估的物流信息，员工审核时会根据实际数据调整。
    </p>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="国际路线" required>
        <el-select v-model="form.route" placeholder="选择路线" style="width:100%" @change="emitUpdate">
          <el-option label="南宁 → 曼谷" value="nanning_bangkok" />
          <el-option label="广州深圳 → 曼谷" value="guangzhou_bangkok" />
          <el-option label="义乌 → 曼谷" value="yiwu_bangkok" />
        </el-select>
      </el-form-item>

      <!-- 仓库地址（选完路线后显示） -->
      <el-alert v-if="warehouse" type="info" :closable="false" show-icon style="margin-bottom:16px">
        <template #title><span style="font-weight:700">对应收货仓库</span></template>
        <div style="font-size:13px;line-height:1.6;margin-top:4px">
          <strong>{{ warehouse.name }}</strong>
          <div>{{ warehouse.address_prev || '' }} {{ warehouse.address_next || '' }}</div>
          <div>电话：{{ warehouse.contact_phone }}</div>
        </div>
      </el-alert>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="预计体积 (m³)" required>
            <el-input-number v-model="form.volume" :min="0" :step="0.1" :precision="2" style="width:100%" @change="emitUpdate" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预计重量 (KG)" required>
            <el-input-number v-model="form.weight" :min="0" :step="0.5" :precision="1" style="width:100%" @change="emitUpdate" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="境内物流">
        <el-select v-model="form.domestic_logistics" placeholder="选择物流公司" style="width:100%" @change="emitUpdate">
          <el-option label="BlueWhite 蓝白物流" value="bluewhite" />
          <el-option label="Flash Express" value="flash" />
          <el-option label="Kerry Express" value="kerry" />
          <el-option label="Nim Express" value="nim" />
          <el-option label="NSS 曼谷自提" value="nss" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">
        <el-tag type="warning" size="small">附加服务（可选）</el-tag>
      </el-divider>

      <el-form-item label="">
        <el-checkbox-group v-model="form.services" @change="emitUpdate">
          <el-checkbox label="form_e" style="margin-right:24px">Form E 产地证 (4,000 ฿)</el-checkbox>
          <el-checkbox label="china_customs" style="margin-right:24px">中国清关费 (4,000 ฿)</el-checkbox>
          <el-checkbox label="thai_customs" style="margin-right:24px">泰国清关费 (3,500 ฿)</el-checkbox>
          <el-checkbox label="pallet">打托盘费 (1,800 ฿)</el-checkbox>
          <el-checkbox label="wooden_box">木箱打包费 (2,500 ฿)</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-row :gutter="16" v-if="form.services.includes('pallet')">
        <el-col :span="12">
          <el-form-item label="托盘数量">
            <el-input-number v-model="form.pallet_count" :min="0" style="width:100%" @change="emitUpdate" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16" v-if="form.services.includes('wooden_box')">
        <el-col :span="12">
          <el-form-item label="木箱体积 (m³)">
            <el-input-number v-model="form.wooden_box_cbm" :min="0" :step="0.1" :precision="2" style="width:100%" @change="emitUpdate" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update'])

const form = reactive({
  route: props.formData?.route || '',
  volume: props.formData?.volume || null,
  weight: props.formData?.weight || null,
  domestic_logistics: props.formData?.domestic_logistics || '',
  need_form_e: props.formData?.need_form_e || false,
  need_china_customs: props.formData?.need_china_customs || false,
  need_thai_customs: props.formData?.need_thai_customs || false,
  pallet_count: props.formData?.pallet_count || 0,
  wooden_box_cbm: props.formData?.wooden_box_cbm || 0,
  services: [],
})

// 回填 services 勾选
if (props.formData?.need_form_e) form.services.push('form_e')
if (props.formData?.need_china_customs) form.services.push('china_customs')
if (props.formData?.need_thai_customs) form.services.push('thai_customs')
if (props.formData?.pallet_count > 0) form.services.push('pallet')
if (props.formData?.wooden_box_cbm > 0) form.services.push('wooden_box')

watch(() => props.formData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return
  if (newVal.route !== undefined) form.route = newVal.route || ''
  if (newVal.volume !== undefined) form.volume = newVal.volume || null
  if (newVal.weight !== undefined) form.weight = newVal.weight || null
  if (newVal.domestic_logistics !== undefined) form.domestic_logistics = newVal.domestic_logistics || ''
  if (newVal.need_form_e !== undefined) { form.need_form_e = newVal.need_form_e; if (newVal.need_form_e && !form.services.includes('form_e')) form.services.push('form_e') }
  if (newVal.need_china_customs !== undefined) { form.need_china_customs = newVal.need_china_customs; if (newVal.need_china_customs && !form.services.includes('china_customs')) form.services.push('china_customs') }
  if (newVal.need_thai_customs !== undefined) { form.need_thai_customs = newVal.need_thai_customs; if (newVal.need_thai_customs && !form.services.includes('thai_customs')) form.services.push('thai_customs') }
  if (newVal.pallet_count !== undefined) form.pallet_count = newVal.pallet_count || 0
  if (newVal.wooden_box_cbm !== undefined) form.wooden_box_cbm = newVal.wooden_box_cbm || 0
}, { deep: true, immediate: false })

const warehouse = ref(null)

watch(() => form.route, async (routeVal) => {
  if (!routeVal) { warehouse.value = null; return }
  try {
    const res = await request.get('/finance/warehouses', { params: { route: routeVal } })
    warehouse.value = res.data
  } catch { warehouse.value = null }
})

function emitUpdate() {
  emit('update', {
    ...form,
    need_form_e: form.services.includes('form_e'),
    need_china_customs: form.services.includes('china_customs'),
    need_thai_customs: form.services.includes('thai_customs'),
    pallet_count: form.services.includes('pallet') ? form.pallet_count : 0,
    wooden_box_cbm: form.services.includes('wooden_box') ? form.wooden_box_cbm : 0,
  })
}

const rules = {
  route: [{ required: true, message: '请选择国际路线', trigger: 'change' }],
  volume: [{ required: true, message: '请输入预计体积', trigger: 'blur' }],
  weight: [{ required: true, message: '请输入预计重量', trigger: 'blur' }],
}

function getFormData() {
  return {
    ...form,
    need_form_e: form.services.includes('form_e'),
    need_china_customs: form.services.includes('china_customs'),
    need_thai_customs: form.services.includes('thai_customs'),
    pallet_count: form.services.includes('pallet') ? form.pallet_count : 0,
    wooden_box_cbm: form.services.includes('wooden_box') ? form.wooden_box_cbm : 0,
  }
}

defineExpose({ getFormData, formRef: null })
</script>

<style scoped>
.step5-forecast { max-width: 600px; }
.step-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.step-desc { color: #909399; font-size: 13px; margin-bottom: 20px; }
</style>
