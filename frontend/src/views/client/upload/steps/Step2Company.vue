<template>
  <div class="step2-company">
    <div class="step-title">
      <el-icon :size="20" color="#409EFF"><OfficeBuilding /></el-icon>
      <span>公司资料</span>
    </div>
    <p class="step-desc">
      如产品无需办理相关许可证，请提供以下公司资料，以便我们为您开户并注册系统。
    </p>

    <!-- 已保存的公司资料选择 -->
    <div v-if="savedDocs.length > 0 && !licenseRequired" class="saved-docs-section">
      <el-alert type="success" :closable="false" show-icon style="margin-bottom: 16px">
        <template #title>
          您已有 {{ savedDocs.length }} 份公司资料，可直接选用
        </template>
      </el-alert>
      <el-radio-group v-model="selectedDocId" @change="onSelectDoc" class="doc-radio-group">
        <el-radio
          v-for="doc in savedDocs"
          :key="doc.id"
          :value="doc.id"
          size="large"
          class="doc-radio-item"
        >
          <span class="doc-radio-label">
            <el-tag size="small" type="primary">{{ doc.company_name || '未命名资料' }}</el-tag>
            <span class="doc-radio-addr">{{ doc.thai_address || '' }}</span>
            <span class="doc-radio-time">{{ formatShort(doc.updated_at) }}</span>
          </span>
        </el-radio>
        <el-radio :value="0" size="large" class="doc-radio-item">
          <span class="doc-radio-label">
            <el-tag size="small" type="info">重新上传新资料</el-tag>
          </span>
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 许可证阻断提示 -->
    <el-alert
      v-if="licenseRequired"
      type="warning"
      :closable="false"
      show-icon
      title="该产品需要办理进口许可证，暂无需填写公司资料。请先联系客服协助办理许可证。"
      style="margin-bottom: 24px"
    />

    <el-form v-else ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- DBD -->
      <el-form-item label="DBD（公司注册证明）" required>
        <div class="upload-row">
          <el-button type="primary" plain @click="triggerUpload('dbd')" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传 DBD 文件
          </el-button>
          <span v-if="form.dbd_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.dbd_file.original_name || '已上传' }}
          </span>
          <input
            ref="dbdInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            hidden
            @change="(e) => handleFileChange(e, 'dbd')"
          />
        </div>
      </el-form-item>

      <!-- PP.20 -->
      <el-form-item label="PP.20（增值税登记证）" required>
        <div class="upload-row">
          <el-button type="primary" plain @click="triggerUpload('pp20')" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传 PP.20 文件
          </el-button>
          <span v-if="form.pp20_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.pp20_file.original_name || '已上传' }}
          </span>
          <input
            ref="pp20Input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            hidden
            @change="(e) => handleFileChange(e, 'pp20')"
          />
        </div>
      </el-form-item>

      <!-- 公司印章 -->
      <el-form-item label="公司印章（如有，请盖在空白纸上）">
        <div class="upload-row">
          <el-button type="primary" plain @click="triggerUpload('stamp')" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传印章扫描件
          </el-button>
          <span v-if="form.company_stamp_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.company_stamp_file.original_name || '已上传' }}
          </span>
          <input
            ref="stampInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            @change="(e) => handleFileChange(e, 'stamp')"
          />
        </div>
      </el-form-item>

      <!-- 董事护照复印件 -->
      <el-form-item label="董事护照复印件" required>
        <div class="upload-row">
          <el-button type="primary" plain @click="triggerUpload('passport')" :disabled="uploading">
            <el-icon><Upload /></el-icon> 上传护照复印件
          </el-button>
          <span v-if="form.director_passport_file" class="file-status uploaded">
            <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
            {{ form.director_passport_file.original_name || '已上传' }}
          </span>
          <input
            ref="passportInput"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            hidden
            @change="(e) => handleFileChange(e, 'passport')"
          />
        </div>
      </el-form-item>

      <!-- 公司名称 -->
      <el-form-item label="公司名称" required>
        <el-input
          v-model="form.company_name"
          placeholder="请填写泰国公司注册名称"
          maxlength="200"
        />
      </el-form-item>

      <!-- 公司税号 -->
      <el-form-item label="公司税号 (TAX ID)">
        <el-input
          v-model="form.tax_id"
          placeholder="请填写公司税号（选填）"
          maxlength="50"
        />
      </el-form-item>

      <!-- 泰国收货地址 -->
      <el-form-item label="泰国收货地址" required>
        <el-input
          v-model="form.thai_address"
          type="textarea"
          :rows="3"
          placeholder="请填写完整的泰国收货地址（省/市/区/详细地址）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { uploadFile } from '@/api/submission'
import { getCompanyDocs } from '@/api/clientProfile'
import { ElMessage } from 'element-plus'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update'])

const formRef = ref(null)
const uploading = ref(false)
const dbdInput = ref(null)
const pp20Input = ref(null)
const stampInput = ref(null)
const passportInput = ref(null)
const savedDocs = ref([])
const selectedDocId = ref(null)

const inputRefs = { dbd: dbdInput, pp20: pp20Input, stamp: stampInput, passport: passportInput }

const form = reactive({
  company_name: props.formData?.company_name || '',
  dbd_file: props.formData?.dbd_file || null,
  pp20_file: props.formData?.pp20_file || null,
  company_stamp_file: props.formData?.company_stamp_file || null,
  director_passport_file: props.formData?.director_passport_file || null,
  thai_address: props.formData?.thai_address || '',
  tax_id: props.formData?.tax_id || '',
})

// 从 Step1 审核结果中判断是否需要进口许可证
const licenseRequired = computed(() => !!props.formData?.license_required)

onMounted(async () => {
  try {
    const res = await getCompanyDocs()
    savedDocs.value = res.data || []
    // 如果当前步骤已有保存的数据（从 formData 恢复），不要用公司资料库覆盖
    const hasStepData = form.company_name || form.dbd_file || form.pp20_file || form.company_stamp_file || form.director_passport_file || form.thai_address || form.tax_id
    if (savedDocs.value.length > 0 && !hasStepData) {
      selectedDocId.value = savedDocs.value[0].id
      fillFromDoc(savedDocs.value[0])
    }
  } catch { /* ignore */ }
})

// 监听 formData 变化，切换回来时恢复数据
watch(() => props.formData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return
  if (newVal.dbd_file !== undefined) form.dbd_file = newVal.dbd_file
  if (newVal.pp20_file !== undefined) form.pp20_file = newVal.pp20_file
  if (newVal.company_stamp_file !== undefined) form.company_stamp_file = newVal.company_stamp_file
  if (newVal.director_passport_file !== undefined) form.director_passport_file = newVal.director_passport_file
  if (newVal.thai_address !== undefined) form.thai_address = newVal.thai_address || ''
  if (newVal.company_name !== undefined) form.company_name = newVal.company_name || ''
  if (newVal.tax_id !== undefined) form.tax_id = newVal.tax_id || ''
}, { deep: true, immediate: false })

function onSelectDoc(id) {
  if (id === 0) {
    // 重新上传
    Object.assign(form, {
      dbd_file: null, pp20_file: null, company_stamp_file: null,
      director_passport_file: null, thai_address: '', tax_id: '', company_name: '',
    })
    emit('update', { ...form })
    return
  }
  const doc = savedDocs.value.find(d => d.id === id)
  if (doc) fillFromDoc(doc)
}

function fillFromDoc(doc) {
  Object.assign(form, {
    company_name: doc.company_name || '',
    dbd_file: isFileObj(doc.dbd_file) ? doc.dbd_file : null,
    pp20_file: isFileObj(doc.pp20_file) ? doc.pp20_file : null,
    company_stamp_file: isFileObj(doc.company_stamp_file) ? doc.company_stamp_file : null,
    director_passport_file: isFileObj(doc.director_passport_file) ? doc.director_passport_file : null,
    thai_address: doc.thai_address || '',
    tax_id: doc.tax_id || '',
  })
  emit('update', { ...form })
}

function isFileObj(obj) {
  return obj && typeof obj === 'object' && obj.original_name
}

function triggerUpload(type) {
  inputRefs[type]?.value?.click()
}

async function handleFileChange(event, type) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadFile(props.submissionId, 2, file)
    if (res.code === 200) {
      const fileInfo = {
        filename: file.name, original_name: res.data.original_name,
        stored_path: res.data.stored_path, url: res.data.url,
        mime_type: res.data.mime_type, size: res.data.size,
      }
      const fieldMap = { dbd: 'dbd_file', pp20: 'pp20_file', stamp: 'company_stamp_file', passport: 'director_passport_file' }
      form[fieldMap[type]] = fileInfo
      emit('update', { ...form })
      ElMessage.success(`${file.name} 上传成功`)
    }
  } catch { ElMessage.error('上传失败') }
  finally { uploading.value = false; event.target.value = '' }
}

function formatShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

var rules = {
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
};

function getFormData() {
  return { ...form }
}

defineExpose({ getFormData, formRef })
</script>

<style lang="scss" scoped>
.saved-docs-section {
  margin-bottom: 20px;

  .doc-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
  }

  .doc-radio-item {
    padding: 10px 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fff;
    width: 100%;
    margin-right: 0;

    .doc-radio-label {
      display: flex;
      align-items: center;
      gap: 10px;

      .doc-radio-addr {
        color: #606266;
        font-size: 13px;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .doc-radio-time {
        color: #c0c4cc;
        font-size: 12px;
      }
    }
  }
}

.step2-company {
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

  .upload-row {
    display: flex;
    align-items: center;
    gap: 16px;

    .file-status {
      font-size: 13px;

      &.uploaded {
        color: #67C23A;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}
</style>
