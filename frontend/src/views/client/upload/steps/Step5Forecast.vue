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
          <el-option label="Lalamove 包车派送" value="lalamove" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">
        <el-tag type="warning" size="small">附加服务</el-tag>
      </el-divider>

      <el-form-item label="">
        <el-checkbox-group v-model="form.services" @change="emitUpdate">
          <el-checkbox label="form_e" style="margin-right:24px">Form E 产地证 (4,000 ฿)</el-checkbox>
          <el-checkbox v-if="props.needRebate" label="china_customs" style="margin-right:24px" :disabled="true">中国报关费 (4,000 ฿) <el-tag type="danger" size="small" style="margin-left:4px">必选</el-tag></el-checkbox>
          <el-checkbox label="thai_customs" style="margin-right:24px" :disabled="true">泰国清关费 (3,500 ฿) <el-tag type="danger" size="small" style="margin-left:4px">必选</el-tag></el-checkbox>
          <el-checkbox label="customs_handling" style="margin-right:24px" :disabled="true">清关手续费 (200 ฿) <el-tag type="danger" size="small" style="margin-left:4px">必选</el-tag></el-checkbox>
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
import { reactive, watch } from 'vue'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
  needRebate: { type: Boolean, default: null },
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
// 泰国清关费始终必选
if (!form.services.includes('thai_customs')) form.services.push('thai_customs'); if (!form.services.includes('customs_handling')) form.services.push('customs_handling')

form.need_thai_customs = true
// 中国报关费仅在需要退税时显示并必选
if (props.needRebate) {
  if (!form.services.includes('china_customs')) form.services.push('china_customs')
  form.need_china_customs = true
}
if (props.formData?.pallet_count > 0) form.services.push('pallet')
if (props.formData?.wooden_box_cbm > 0) form.services.push('wooden_box')

watch(() => props.formData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return
  if (newVal.route !== undefined) form.route = newVal.route || ''
  if (newVal.volume !== undefined) form.volume = newVal.volume || null
  if (newVal.weight !== undefined) form.weight = newVal.weight || null
  if (newVal.domestic_logistics !== undefined) form.domestic_logistics = newVal.domestic_logistics || ''
  if (newVal.need_form_e !== undefined) { form.need_form_e = newVal.need_form_e; if (newVal.need_form_e && !form.services.includes('form_e')) form.services.push('form_e') }
  if (newVal.need_china_customs !== undefined && props.needRebate) { form.need_china_customs = true; if (!form.services.includes('china_customs')) form.services.push('china_customs') }
  if (newVal.need_thai_customs !== undefined) { form.need_thai_customs = true; if (!form.services.includes('thai_customs')) form.services.push('thai_customs'); if (!form.services.includes('customs_handling')) form.services.push('customs_handling') }
  if (newVal.pallet_count !== undefined) form.pallet_count = newVal.pallet_count || 0
  if (newVal.wooden_box_cbm !== undefined) form.wooden_box_cbm = newVal.wooden_box_cbm || 0
}, { deep: true, immediate: false })
function emitUpdate() {
  // 确保必选项不被取消
  if (!form.services.includes('thai_customs')) form.services.push('thai_customs'); if (!form.services.includes('customs_handling')) form.services.push('customs_handling')
  if (props.needRebate && !form.services.includes('china_customs')) form.services.push('china_customs')
  if (!props.needRebate) {
    const idx = form.services.indexOf('china_customs')
    if (idx > -1) form.services.splice(idx, 1)
  }
  emit('update', {
    ...form,
    need_form_e: form.services.includes('form_e'),
    need_china_customs: props.needRebate ? true : false,
    need_thai_customs: true,
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
  // 确保必选项不被取消
  if (!form.services.includes('thai_customs')) form.services.push('thai_customs'); if (!form.services.includes('customs_handling')) form.services.push('customs_handling')
  if (props.needRebate && !form.services.includes('china_customs')) form.services.push('china_customs')
  if (!props.needRebate) {
    const idx = form.services.indexOf('china_customs')
    if (idx > -1) form.services.splice(idx, 1)
  }
  return {
    ...form,
    need_form_e: form.services.includes('form_e'),
    need_china_customs: props.needRebate ? true : false,
    need_thai_customs: true,
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
