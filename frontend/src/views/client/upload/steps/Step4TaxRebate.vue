<template>
  <div class="step4-tax">
    <div class="step-title">
      <el-icon :size="20" color="#409EFF"><Money /></el-icon>
      <span>中国出口退税</span>
    </div>
    <p class="step-desc">
      在货物入仓前，请确认客户是否需要申请中国出口退税。
    </p>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- 是否需要退税 -->
      <el-form-item label="是否需要申请中国出口退税？" required>
        <el-radio-group v-model="form.need_rebate" @change="handleRebateChange">
          <el-radio :value="true" size="large">
            <span class="radio-label">需要退税</span>
          </el-radio>
          <el-radio :value="false" size="large">
            <span class="radio-label">不需要退税</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- ===== 需要退税 ===== -->
      <template v-if="form.need_rebate">
        <el-divider content-position="left">
          <el-tag type="warning" size="small">退税方案</el-tag>
        </el-divider>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>需使用客户公司名义向中国海关申报</template>
          <p style="margin: 8px 0 0; line-height: 1.8">
            我们将与中国物流（微信）对接，协助完成报关流程。
          </p>
        </el-alert>

        <el-form-item label="报关公司名称" required>
          <el-input v-model="form.customs_company_name" placeholder="用于报关的公司全称" maxlength="200" @input="emitUpdate" />
        </el-form-item>
        <el-form-item label="物流对接人（微信）">
          <el-input v-model="form.logistics_contact" placeholder="物流对接人微信号或手机号" maxlength="200" @input="emitUpdate" />
        </el-form-item>
      </template>

      <!-- ===== 不需要退税 ===== -->
      <template v-if="form.need_rebate === false">
        <el-divider content-position="left">
          <el-tag type="info" size="small">货代方案</el-tag>
        </el-divider>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 20px"
        >
          <template #title>直接使用货代（Shipping）名义报关</template>
          <p style="margin: 8px 0 0; line-height: 1.8">
            我们会协助完成产品备案，只需提供以下两个文件即可。
          </p>
        </el-alert>
      </template>

      <!-- ===== 发票和装箱单（无论是否退税都需要） ===== -->
      <el-divider content-position="left">
        <el-tag type="warning" size="small">必传文件</el-tag>
      </el-divider>

      <el-form-item label="商业发票（Invoice）" required>
        <div class="upload-row">
          <el-button type="primary" plain @click="$refs.invoiceInput.click()" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传 Invoice
          </el-button>
          <span v-if="form.invoice_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.invoice_file.original_name || '已上传' }}
          </span>
          <input
            ref="invoiceInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            hidden
            @change="(e) => handleFileChange(e, 'invoice_file')" multiple
          />
        </div>
      </el-form-item>

      <el-form-item label="装箱单（Packing List）" required>
        <div class="upload-row">
          <el-button type="primary" plain @click="$refs.plInput.click()" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传 Packing List
          </el-button>
          <span v-if="form.packing_list_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.packing_list_file.original_name || '已上传' }}
          </span>
          <input
            ref="plInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            hidden
            @change="(e) => handleFileChange(e, 'packing_list_file')" multiple
          />
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { uploadFile } from '@/api/submission'
import { ElMessage } from 'element-plus'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update'])

const formRef = ref(null)
const uploading = ref(false)

const form = reactive({
  need_rebate: props.formData?.need_rebate ?? null,
  customs_company_name: props.formData?.customs_company_name || '',
  logistics_contact: props.formData?.logistics_contact || '',
  invoice_file: props.formData?.invoice_file || null,
  packing_list_file: props.formData?.packing_list_file || null,
})

// 监听 formData 变化，切换回来时恢复数据
watch(() => props.formData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return
  if (newVal.need_rebate !== undefined) form.need_rebate = newVal.need_rebate
  if (newVal.customs_company_name !== undefined) form.customs_company_name = newVal.customs_company_name || ''
  if (newVal.logistics_contact !== undefined) form.logistics_contact = newVal.logistics_contact || ''
  if (newVal.invoice_file !== undefined) form.invoice_file = newVal.invoice_file
  if (newVal.packing_list_file !== undefined) form.packing_list_file = newVal.packing_list_file
}, { deep: true, immediate: false })

function emitUpdate() {
  emit('update', { ...form })
}

function handleRebateChange() {
  // 切换退税选项时，清空另一方案的数据（发票和装箱单两种方案都需要，不清空）
  if (!form.need_rebate) {
    form.customs_company_name = ''
    form.logistics_contact = ''
  }
  emitUpdate()
}

async function handleFileChange(event, field) {
  const files = event.target.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const res = await uploadFile(props.submissionId, 4, file)
      if (res.code === 200) {
        form[field] = {
          filename: file.name,
          original_name: res.data.original_name,
          stored_path: res.data.stored_path,
          url: res.data.url,
          mime_type: res.data.mime_type,
          size: res.data.size,
        }
        emitUpdate()
      }
    }
    ElMessage.success(`${files.length} 个文件上传成功`)
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

var rules = {
  need_rebate: [{ required: true, message: '请选择退税类型', trigger: 'change', validator: function(rule, value, cb) { if (value === null || value === undefined) cb(new Error('请选择是否需要退税')); else cb(); } }],
  customs_company_name: [{ required: true, message: '请输入报关公司名称', trigger: 'blur' }],
  invoice_file: [{ required: true, message: '请上传商业发票', trigger: 'change', validator: function(rule, value, cb) { if (!value || !value.url) cb(new Error('请上传商业发票')); else cb(); } }],
  packing_list_file: [{ required: true, message: '请上传装箱单', trigger: 'change', validator: function(rule, value, cb) { if (!value || !value.url) cb(new Error('请上传装箱单')); else cb(); } }],
};

function getFormData() {
  return { ...form }
}

defineExpose({ getFormData, formRef })
</script>

<style lang="scss" scoped>
.step4-tax {
  .step-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .step-desc {
    color: #909399;
    font-size: 14px;
    margin-bottom: 24px;
    line-height: 1.6;
  }

  .radio-label {
    font-size: 15px;
    margin-left: 4px;
  }

  .upload-row {
    display: flex;
    align-items: center;
    gap: 16px;

    .file-status.uploaded {
      color: #67C23A;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
    }
  }
}
</style>
