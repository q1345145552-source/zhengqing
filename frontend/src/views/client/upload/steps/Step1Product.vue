<template>
  <div class="step1-product">
    <div class="step-title">
      <el-icon :size="20" color="#409EFF"><Box /></el-icon>
      <span>产品确认</span>
    </div>
    <p class="step-desc">
      请提供产品图片、泰文名称及英文名称，由我们协助确认产品进口信息。
    </p>

    <el-form ref="formRef" :model="form" label-width="140px" label-position="top">
      <!-- 产品图片 -->
      <el-form-item label="产品图片" required>
        <el-upload
          v-model:file-list="fileList"
          :http-request="customUpload"
          :on-remove="handleRemove"
          :before-upload="beforeUpload"
          list-type="picture-card"
          :limit="5"
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
        <div class="upload-tip">支持 JPG/PNG 格式，最多 5 张，单张不超过 10MB</div>
      </el-form-item>

      <!-- 泰文名称 -->
      <el-form-item label="产品泰文名称" required>
        <el-input
          v-model="form.thai_name"
          placeholder="请输入产品泰文名称"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 英文名称 -->
      <el-form-item label="产品英文名称" required>
        <el-input
          v-model="form.english_name"
          placeholder="请输入产品英文名称"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 员工确认信息（只读展示） -->
      <el-divider content-position="left">
        <el-icon><UserFilled /></el-icon> 产品确认信息（由审核人员填写）
      </el-divider>

      <el-alert
        v-if="!hasReview"
        type="info"
        :closable="false"
        show-icon
        title="提交产品信息后，审核人员将确认以下内容并在此显示结果"
      />

      <el-descriptions v-else :column="2" border size="small">
        <el-descriptions-item label="是否可进口">
          <el-tag :type="review.import_eligible ? 'success' : 'danger'" size="small">
            {{ review.import_eligible ? '可进口' : '待确认' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="进口关税税率">
          {{ review.tariff_rate || '待确认' }}
        </el-descriptions-item>
        <el-descriptions-item label="是否可用 Form E">
          <el-tag :type="review.form_e_eligible ? 'success' : 'warning'" size="small">
            {{ review.form_e_eligible ? '可使用' : '待确认' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="HS Code">
          {{ review.hs_code || '待确认' }}
        </el-descriptions-item>
        <el-descriptions-item label="是否需要进口许可证" :span="2">
          <el-tag :type="review.license_required ? 'danger' : 'success'" size="small">
            {{ review.license_required === null ? '待确认' : review.license_required ? '需要' : '无需' }}
          </el-tag>
          <span v-if="review.license_notes" style="margin-left: 8px; color: #909399; font-size: 13px">
            {{ review.license_notes }}
          </span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 如果产品需要许可证，显示提示 -->
      <el-alert
        v-if="review.license_required"
        type="warning"
        :closable="false"
        show-icon
        title="该产品需要办理进口许可证，请联系客服协助办理"
        style="margin-top: 16px"
      />
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { uploadFile } from '@/api/submission'
import { ElMessage } from 'element-plus'

const props = defineProps({
  submissionId: { type: Number, default: null },
  formData: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update'])

const formRef = ref(null)
const fileList = ref([])
const uploading = ref(false)

const form = reactive({
  product_images: [],
  thai_name: '',
  english_name: '',
  ...props.formData,
})

const review = computed(() => ({
  import_eligible: props.formData?.import_eligible ?? null,
  tariff_rate: props.formData?.tariff_rate || '',
  form_e_eligible: props.formData?.form_e_eligible ?? null,
  hs_code: props.formData?.hs_code || '',
  license_required: props.formData?.license_required ?? null,
  license_notes: props.formData?.license_notes || '',
}))

const hasReview = computed(() => review.value.hs_code || review.value.tariff_rate)

// 恢复已有的产品图片
const imageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('/uploads')) return path
  const idx = path.indexOf('/uploads/')
  return idx >= 0 ? path.slice(idx) : path
}

onMounted(() => {
  const images = props.formData?.product_images || []
  fileList.value = images.map((img, i) => ({
    uid: i,
    name: img.original_name || img.filename || `image_${i}`,
    url: img.url || imageUrl(img.stored_path || img.path || ''),
    status: 'success',
  }))
  form.product_images = images
})

function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('仅支持图片格式')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

async function customUpload(options) {
  uploading.value = true
  try {
    const res = await uploadFile(props.submissionId, 1, options.file)
    if (res.code === 200) {
      form.product_images.push({
        filename: options.file.name,
        original_name: res.data.original_name,
        stored_path: res.data.stored_path,
        url: res.data.url,
        mime_type: res.data.mime_type,
        size: res.data.size,
      })
      emitUpdate()
      options.onSuccess(res, options.file)
    }
  } catch (err) {
    options.onError(err)
  } finally {
    uploading.value = false
  }
}

function handleRemove(uploadFile) {
  const url = uploadFile.url || ''
  form.product_images = form.product_images.filter(
    (img) => img.url !== url
  )
  emitUpdate()
}

function emitUpdate() {
  emit('update', { ...form })
}

function getFormData() {
  return {
    product_images: form.product_images,
    thai_name: form.thai_name,
    english_name: form.english_name,
  }
}

defineExpose({ getFormData })
</script>

<style lang="scss" scoped>
.step1-product {
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

  .upload-tip {
    font-size: 12px;
    color: #c0c4cc;
    margin-top: 4px;
  }
}
</style>
