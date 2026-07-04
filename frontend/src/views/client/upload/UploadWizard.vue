<template>
  <div class="upload-wizard">
    <!-- 头部 -->
    <div class="wizard-header">
      <h2>
        <el-icon><UploadFilled /></el-icon>
        资料上传
      </h2>
      <el-tag v-if="submission" type="info" size="small">
        第 {{ currentStep }}/5 步
      </el-tag>
    </div>

    <!-- 步骤条 -->
    <el-steps :active="currentStep - 1" align-center class="wizard-steps">
      <el-step title="产品确认" description="确认产品进口信息" />
      <el-step title="公司资料" description="上传公司证明文件" />
      <el-step title="报关授权" description="海关报关代理登记" />
      <el-step title="出口退税" description="确认退税申报方式" />
      <el-step title="预报单" description="填写物流预估信息" />
    </el-steps>

    <!-- loading -->
    <div v-if="loading" class="wizard-loading">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- 步骤内容 -->
    <div v-else class="wizard-body">
      <component
        :is="currentStepComponent"
        :ref="setStepRef"
        :submission-id="submission?.id"
        :form-data="stepData"
        :need-rebate="allStepData[4]?.need_rebate ?? submission?.step4?.need_rebate"
        @update="handleStepUpdate"
      />
    </div>

    <!-- 底部操作栏 -->
    <div v-if="!loading" class="wizard-footer">
      <el-button
        v-if="currentStep > 1"
        @click="prevStep"
        :disabled="saving"
      >
        上一步
      </el-button>
      <el-button
        @click="saveDraft"
        :loading="saving"
        type="info"
        plain
      >
        保存草稿
      </el-button>
      <el-button
        @click="discardDraft"
        type="danger"
        plain
      >
        放弃草稿重新填写
      </el-button>
      <el-button
        v-if="currentStep < 5"
        type="primary"
        @click="nextStep"
        :loading="saving"
      >
        下一步 →
      </el-button>
      <el-button
        v-else
        type="success"
        @click="handleSubmit"
        :loading="submitting"
      >
        提交资料
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getCurrentSubmission,
  createSubmission,
  saveStep,
  submitSubmission,
  deleteSubmission,
} from '@/api/submission'
import Step1Product from './steps/Step1Product.vue'
import Step2Company from './steps/Step2Company.vue'
import Step3CustomsAuth from './steps/Step3CustomsAuth.vue'
import Step4TaxRebate from './steps/Step4TaxRebate.vue'
import Step5Forecast from './steps/Step5Forecast.vue'

const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const submitting = ref(false)
const discarding = ref(false)
const submission = ref(null)
const currentStep = ref(1)
const stepData = ref({})
// 本地步骤数据缓存：key=步骤编号, value=步骤表单数据
// 用于跨步骤切换时保持数据，避免依赖 submission.value 中的旧数据
const allStepData = ref({})
let currentStepRef = null

const stepComponents = [
  null, // index 0 placeholder
  markRaw(Step1Product),
  markRaw(Step2Company),
  markRaw(Step3CustomsAuth),
  markRaw(Step4TaxRebate),
  markRaw(Step5Forecast),
]

const currentStepComponent = computed(() => stepComponents[currentStep.value])

function setStepRef(el) {
  currentStepRef = el
}

// 加载或创建 submission
onMounted(async () => {
  try {
    let res = await getCurrentSubmission()
    if (res.data) {
      submission.value = res.data
      currentStep.value = res.data.current_step || 1
      loadStepData()
    } else {
      res = await createSubmission()
      submission.value = res.data
      currentStep.value = 1
    }
  } catch (err) {
    ElMessage.error('加载失败，请刷新重试')
  } finally {
    loading.value = false
  }
})

function loadStepData() {
  const s = submission.value
  const step = currentStep.value
  // 优先使用本地缓存（用户当前会话中保存的数据），其次用服务端返回的数据
  const cached = allStepData.value[step]
  const fromSub = s ? s['step' + step] : null
  stepData.value = cached || fromSub || {}
}

function handleStepUpdate(data) {
  stepData.value = { ...stepData.value, ...data }
  // 同步更新本地缓存
  allStepData.value[currentStep.value] = { ...stepData.value }
}

async function saveCurrentStep() {
  if (!submission.value) return
  // 从子组件获取表单数据
  if (currentStepRef && currentStepRef.getFormData) {
    stepData.value = currentStepRef.getFormData()
  }
  await saveStep(submission.value.id, currentStep.value, stepData.value)
  // 保存成功后更新本地缓存，确保返回上一步时数据不丢失
  allStepData.value[currentStep.value] = { ...stepData.value }
}

async function nextStep() {
  if (submission.value?.status === 'submitted') {
    ElMessage.warning('资料已提交，无法修改')
    return
  }
  // 校验当前步骤表单
  if (currentStepRef && currentStepRef.formRef) {
    try {
      await currentStepRef.formRef.validate()
    } catch {
      ElMessage.warning('请填写当前步骤的必填项')
      return
    }
  }
  saving.value = true
  try {
    await saveCurrentStep()
    if (currentStep.value < 5) {
      currentStep.value++
      loadStepData()
    }
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

async function prevStep() {
  if (currentStep.value > 1) {
    // 回退前先保存当前步骤（不调用后端，只更新缓存）
    if (currentStepRef && currentStepRef.getFormData) {
      const data = currentStepRef.getFormData()
      allStepData.value[currentStep.value] = { ...data }
    }
    currentStep.value--
    loadStepData()
  }
}

async function saveDraft() {
  saving.value = true
  try {
    await saveCurrentStep()
    ElMessage.success('草稿已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function discardDraft() {
  if (!submission.value) return
  try {
    await ElMessageBox.confirm(
      '当前已保存的草稿将被删除，确认放弃并重新填写？',
      '放弃草稿',
      { confirmButtonText: '确认放弃', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  discarding.value = true
  try {
    await deleteSubmission(submission.value.id)
    // 清空本地状态
    submission.value = null
    allStepData.value = {}
    stepData.value = {}
    currentStep.value = 1
    // 重新创建一份全新的
    const res = await createSubmission()
    submission.value = res.data
    ElMessage.success('草稿已放弃，请重新填写')
  } catch {
    ElMessage.error('操作失败，请重试')
  } finally {
    discarding.value = false
  }
}

async function handleSubmit() {
  if (submission.value?.status === 'submitted') {
    ElMessage.warning('资料已提交')
    return
  }
  try {
    await ElMessageBox.confirm(
      '提交后资料将交由员工审核，确认提交？',
      '确认提交',
      { confirmButtonText: '确认提交', cancelButtonText: '再检查一下', type: 'warning' }
    )
  } catch { return }

  submitting.value = true
  try {
    await saveCurrentStep()
    await submitSubmission(submission.value.id)
    submission.value.status = 'submitted'
    ElMessage.success('资料提交成功！我们会尽快处理')
    router.push('/client/dashboard')
  } catch {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.upload-wizard {
  max-width: 800px;
  margin: 0 auto;
}

.wizard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 22px;
    color: #303133;
  }
}

.wizard-steps {
  margin-bottom: 32px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.wizard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px;
  color: #909399;
}

.wizard-body {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  margin-bottom: 24px;
  min-height: 300px;
}

.wizard-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-bottom: 40px;
}
</style>
