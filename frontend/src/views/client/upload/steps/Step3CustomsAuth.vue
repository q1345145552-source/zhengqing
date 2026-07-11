<template>
  <div class="step3-customs">
    <div class="step-title">
      <el-icon :size="20" color="#409EFF"><Stamp /></el-icon>
      <span>海关报关代理授权登记</span>
    </div>
    <p class="step-desc">
      我们将办理海关报关代理（Customs Broker）授权登记。请先确认办理方式。
    </p>

    <!-- 已保存的报关授权选择 -->
    <div v-if="savedAuths.length > 0" class="saved-auths-section">
      <el-alert type="success" :closable="false" show-icon style="margin-bottom: 16px">
        <template #title>
          您已有 {{ savedAuths.length }} 份报关授权信息，可直接选用
        </template>
      </el-alert>
      <el-radio-group v-model="selectedAuthId" @change="onSelectAuth" class="auth-radio-group">
        <el-radio
          v-for="auth in savedAuths"
          :key="auth.id"
          :value="auth.id"
          size="large"
          class="auth-radio-item"
        >
          <span class="auth-radio-label">
            <el-tag size="small" :type="auth.auth_type === 'director' ? 'success' : 'warning'">
              {{ auth.auth_type === 'director' ? '董事本人办理' : '委托办理' }}
            </el-tag>
            <span v-if="auth.account_number" class="auth-radio-account">账号: {{ auth.account_number }}</span>
            <span class="auth-radio-time">{{ formatShort(auth.updated_at) }}</span>
          </span>
        </el-radio>
        <el-radio :value="0" size="large" class="auth-radio-item">
          <span class="auth-radio-label">
            <el-tag size="small" type="info">重新录入新授权</el-tag>
          </span>
        </el-radio>
      </el-radio-group>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <!-- 办理方式选择 -->
      <el-form-item label="请选择办理方式" required>
        <el-radio-group v-model="form.handler_type" @change="emitUpdate">
          <el-radio value="director" size="large">
            <span class="radio-label">董事本人前往泰国海关办理</span>
          </el-radio>
          <el-radio value="agent" size="large">
            <span class="radio-label">委托我们代为办理</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 董事本人办理 -->
      <el-alert
        v-if="form.handler_type === 'director'"
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          <strong>董事本人办理流程</strong>
        </template>
        <p style="margin: 8px 0 0; line-height: 1.8">
          我们将为您准备相关文件，由您自行携带至泰国海关提交办理。
        </p>
      </el-alert>

      <!-- 委托办理 -->
      <div v-if="form.handler_type === 'agent'" class="agent-section">
        <el-divider content-position="left">委托办理需准备以下资料</el-divider>

        <!-- 授权委托书 -->
        <el-form-item label="授权委托书（董事亲笔签字 + 加盖公司印章）" required>
          <div class="upload-row">
            <el-button type="primary" plain @click="$refs.poaInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传授权委托书
            </el-button>
                      <div v-if="form.power_of_attorney_file.length > 0" class="file-list">
            <div v-for="(f, idx) in form.power_of_attorney_file" :key="idx" class="file-item">
              <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
              <span class="file-name">{{ f.original_name || '已上传' }}</span>
              <el-button type="danger" size="small" @click="removeFile('power_of_attorney_file', idx)" :disabled="uploading">删除</el-button>
            </div>
          </div>
            <input
              ref="poaInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              hidden
              @change="(e) => handleFileChange(e, 'power_of_attorney_file')" multiple
            />
          </div>
        </el-form-item>

        <!-- PP.20 签字盖章 -->
        <el-form-item label="PP.20（董事签字 + 加盖公司印章）" required>
          <div class="upload-row">
            <el-button type="primary" plain @click="$refs.pp20sInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传 PP.20
            </el-button>
                      <div v-if="form.pp20_signed_file.length > 0" class="file-list">
            <div v-for="(f, idx) in form.pp20_signed_file" :key="idx" class="file-item">
              <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
              <span class="file-name">{{ f.original_name || '已上传' }}</span>
              <el-button type="danger" size="small" @click="removeFile('pp20_signed_file', idx)" :disabled="uploading">删除</el-button>
            </div>
          </div>
            <input
              ref="pp20sInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              hidden
              @change="(e) => handleFileChange(e, 'pp20_signed_file')" multiple
            />
          </div>
        </el-form-item>

        <!-- DBD 签字盖章 -->
        <el-form-item label="DBD 公司注册证明（董事签字 + 加盖公司印章）" required>
          <div class="upload-row">
            <el-button type="primary" plain @click="$refs.dbdsInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传 DBD
            </el-button>
                      <div v-if="form.dbd_signed_file.length > 0" class="file-list">
            <div v-for="(f, idx) in form.dbd_signed_file" :key="idx" class="file-item">
              <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
              <span class="file-name">{{ f.original_name || '已上传' }}</span>
              <el-button type="danger" size="small" @click="removeFile('dbd_signed_file', idx)" :disabled="uploading">删除</el-button>
            </div>
          </div>
            <input
              ref="dbdsInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              hidden
              @change="(e) => handleFileChange(e, 'dbd_signed_file')" multiple
            />
          </div>
        </el-form-item>

        <!-- 董事护照原件 -->
        <el-form-item label="董事护照原件" required>
          <el-checkbox v-model="form.has_director_passport_original" @change="emitUpdate">
            <strong>我已提供董事护照原件</strong>
          </el-checkbox>
          <div class="field-hint">办理报关代理授权需提供董事护照原件</div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { uploadFile } from '@/api/submission'
import { getCustomsAuths } from '@/api/clientProfile'
import { ElMessage } from 'element-plus'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update'])

const formRef = ref(null)
const uploading = ref(false)
const savedAuths = ref([])
const selectedAuthId = ref(null)

const form = reactive({
  handler_type: props.formData?.handler_type || 'director',
  power_of_attorney_file: props.formData?.power_of_attorney_file || null,
  pp20_signed_file: props.formData?.pp20_signed_file || null,
  dbd_signed_file: props.formData?.dbd_signed_file || null,
  has_director_passport_original: props.formData?.has_director_passport_original || false,
})

onMounted(async () => {
  try {
    const res = await getCustomsAuths()
    savedAuths.value = res.data || []
    // 如果当前步骤已有保存的数据（从 formData 恢复），不要用报关授权库覆盖
    const hasStepData = form.power_of_attorney_file || form.pp20_signed_file || form.dbd_signed_file || form.handler_type !== 'director'
    if (savedAuths.value.length > 0 && !hasStepData) {
      selectedAuthId.value = savedAuths.value[0].id
      fillFromAuth(savedAuths.value[0])
    }
  } catch { /* ignore */ }
})

// 监听 formData 变化，切换回来时恢复数据
watch(() => props.formData, (newVal) => {
  if (!newVal || Object.keys(newVal).length === 0) return
  if (newVal.handler_type !== undefined) form.handler_type = newVal.handler_type || 'director'
  if (newVal.power_of_attorney_file !== undefined) form.power_of_attorney_file = normalizeFiles(newVal.power_of_attorney_file)
  if (newVal.pp20_signed_file !== undefined) form.pp20_signed_file = normalizeFiles(newVal.pp20_signed_file)
  if (newVal.dbd_signed_file !== undefined) form.dbd_signed_file = normalizeFiles(newVal.dbd_signed_file)
  if (newVal.has_director_passport_original !== undefined) form.has_director_passport_original = newVal.has_director_passport_original
}, { deep: true, immediate: false })

function onSelectAuth(id) {
  if (id === 0) {
    Object.assign(form, {
      handler_type: 'director', power_of_attorney_file: null,
      pp20_signed_file: null, dbd_signed_file: null,
      has_director_passport_original: false,
    })
    emitUpdate()
    return
  }
  const auth = savedAuths.value.find(a => a.id === id)
  if (auth) fillFromAuth(auth)
}

function fillFromAuth(auth) {
  Object.assign(form, {
    handler_type: auth.auth_type || 'director',
    power_of_attorney_file: isFileObj(auth.power_of_attorney_file) ? auth.power_of_attorney_file : null,
    pp20_signed_file: isFileObj(auth.pp20_signed_file) ? auth.pp20_signed_file : null,
    dbd_signed_file: isFileObj(auth.dbd_signed_file) ? auth.dbd_signed_file : null,
    has_director_passport_original: false,
  })
  emitUpdate()
}

function isFileObj(obj) {
  return obj && typeof obj === 'object' && obj.original_name
}

function formatShort(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function emitUpdate() {
  emit('update', { ...form })
}

async function handleFileChange(event, field) {
  const files = event.target.files
  if (!files || files.length === 0) return

  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const res = await uploadFile(props.submissionId, 3, file)
      if (res.code === 200) {
        form[field].push({
          filename: file.name,
          original_name: res.data.original_name,
          stored_path: res.data.stored_path,
          url: res.data.url,
          mime_type: res.data.mime_type,
          size: res.data.size,
        })
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

function removeFile(field, idx) {
  form[field].splice(idx, 1)
  emitUpdate()
}

var rules = {
  handler_type: [{ required: true, message: '请选择授权类型', trigger: 'change' }],
};

function getFormData() {
  return { ...form }
}

defineExpose({ getFormData, formRef })
</script>

<style lang="scss" scoped>
.saved-auths-section {
  margin-bottom: 20px;

  .auth-radio-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #fafafa;
    border-radius: 8px;
  }

  .auth-radio-item {
    padding: 10px 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fff;
    width: 100%;
    margin-right: 0;

    .auth-radio-label {
      display: flex;
      align-items: center;
      gap: 10px;

      .auth-radio-account {
        color: #606266;
        font-size: 13px;
      }

      .auth-radio-time {
        color: #c0c4cc;
        font-size: 12px;
      }
    }
  }
}

.step3-customs {
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

  .agent-section {
    margin-top: 16px;
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

  .field-hint {
    font-size: 12px;
    color: #c0c4cc;
    margin-top: 4px;
  }
}
.file-list { margin-top: 8px; }
.file-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; margin-bottom: 4px; background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 6px; }
.file-item .file-name { flex: 1; font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
