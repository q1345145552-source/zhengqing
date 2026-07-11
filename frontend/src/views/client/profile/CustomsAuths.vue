<template>
  <div class="customs-auths">
    <!-- 已保存列表 -->
    <div v-if="auths.length > 0" class="auths-list">
      <div
        v-for="auth in auths"
        :key="auth.id"
        class="auth-card"
      >
        <div class="auth-info">
          <el-tag :type="auth.auth_type === 'director' ? 'success' : 'warning'" size="small">
            {{ auth.auth_type === 'director' ? '董事本人办理' : '委托办理' }}
          </el-tag>
          <span v-if="auth.account_number" class="auth-account">
            账号: {{ auth.account_number }}
          </span>
          <span v-if="auth.notes" class="auth-notes">{{ auth.notes }}</span>
          <span class="doc-time">{{ formatDate(auth.updated_at) }}</span>
        </div>
        <div class="auth-actions">
          <el-button size="small" text type="primary" @click="editAuth(auth)">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-popconfirm title="确定删除该授权信息？" @confirm="handleDelete(auth.id)">
            <template #reference>
              <el-button size="small" text type="danger">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无报关授权信息，点击下方按钮新增" :image-size="80" />

    <div style="margin-top: 20px; text-align: center">
      <el-button type="primary" @click="showDialog = true; editingAuth = null">
        <el-icon><Plus /></el-icon> 新增报关授权
      </el-button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="editingAuth ? '编辑报关授权' : '新增报关授权'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="办理方式" prop="auth_type">
          <el-radio-group v-model="form.auth_type">
            <el-radio value="director">董事本人办理</el-radio>
            <el-radio value="agent">委托办理</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="报关账号">
          <el-input v-model="form.account_number" placeholder="海关报关系统账号" maxlength="100" />
        </el-form-item>

        <el-form-item label="报关密码">
          <el-input v-model="form.password" type="password" placeholder="海关报关系统密码" show-password maxlength="100" />
        </el-form-item>

        <template v-if="form.auth_type === 'agent'">
          <el-divider content-position="left">委托办理所需文件</el-divider>

          <el-form-item label="授权委托书">
            <div class="inline-upload">
              <el-button size="small" plain @click="$refs.poaDlgInput.click()" :disabled="uploading">
                <el-icon><Upload /></el-icon> 上传
              </el-button>
              <span v-if="form.power_of_attorney_file?.original_name" class="uploaded-name">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                {{ form.power_of_attorney_file.original_name }}
              </span>
              <input ref="poaDlgInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'power_of_attorney_file')" multiple />
            </div>
          </el-form-item>

          <el-form-item label="PP.20（签字盖章）">
            <div class="inline-upload">
              <el-button size="small" plain @click="$refs.pp20sDlgInput.click()" :disabled="uploading">
                <el-icon><Upload /></el-icon> 上传
              </el-button>
              <span v-if="form.pp20_signed_file?.original_name" class="uploaded-name">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                {{ form.pp20_signed_file.original_name }}
              </span>
              <input ref="pp20sDlgInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'pp20_signed_file')" multiple />
            </div>
          </el-form-item>

          <el-form-item label="DBD（签字盖章）">
            <div class="inline-upload">
              <el-button size="small" plain @click="$refs.dbdsDlgInput.click()" :disabled="uploading">
                <el-icon><Upload /></el-icon> 上传
              </el-button>
              <span v-if="form.dbd_signed_file?.original_name" class="uploaded-name">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                {{ form.dbd_signed_file.original_name }}
              </span>
              <input ref="dbdsDlgInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'dbd_signed_file')" multiple />
            </div>
          </el-form-item>
        </template>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="其他备注信息" maxlength="500" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingAuth ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCustomsAuths, createCustomsAuth, updateCustomsAuth, deleteCustomsAuth, uploadProfileFile } from '@/api/clientProfile'
import { ElMessage } from 'element-plus'

const auths = ref([])
const showDialog = ref(false)
const editingAuth = ref(null)
const saving = ref(false)
const uploading = ref(false)
const formRef = ref(null)

const emptyForm = () => ({
  auth_type: 'director',
  account_number: '',
  password: '',
  power_of_attorney_file: null,
  pp20_signed_file: null,
  dbd_signed_file: null,
  notes: '',
})

const form = reactive(emptyForm())

const rules = {
  auth_type: [{ required: true, message: '请选择办理方式', trigger: 'change' }],
}

onMounted(() => loadAuths())

async function loadAuths() {
  try {
    const res = await getCustomsAuths()
    auths.value = res.data || []
  } catch { /* handled */ }
}

function editAuth(auth) {
  editingAuth.value = auth
  form.auth_type = auth.auth_type || 'director'
  form.account_number = auth.account_number || ''
  form.password = auth.password || ''
  form.power_of_attorney_file = auth.power_of_attorney_file && typeof auth.power_of_attorney_file === 'object' && auth.power_of_attorney_file.original_name ? auth.power_of_attorney_file : null
  form.pp20_signed_file = auth.pp20_signed_file && typeof auth.pp20_signed_file === 'object' && auth.pp20_signed_file.original_name ? auth.pp20_signed_file : null
  form.dbd_signed_file = auth.dbd_signed_file && typeof auth.dbd_signed_file === 'object' && auth.dbd_signed_file.original_name ? auth.dbd_signed_file : null
  form.notes = auth.notes || ''
  showDialog.value = true
}

async function handleDialogUpload(event, field) {
  const files = event.target.files
  if (!files || files.length === 0) return
  uploading.value = true
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const res = await uploadProfileFile(file)
      if (res.code === 200) {
        form[field] = {
          original_name: res.data.original_name,
          stored_path: res.data.stored_path,
          url: res.data.url,
          mime_type: res.data.mime_type,
          size: res.data.size,
        }
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

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const data = {
      auth_type: form.auth_type,
      account_number: form.account_number,
      password: form.password,
      power_of_attorney_file: form.power_of_attorney_file,
      pp20_signed_file: form.pp20_signed_file,
      dbd_signed_file: form.dbd_signed_file,
      notes: form.notes,
    }

    if (editingAuth.value) {
      await updateCustomsAuth(editingAuth.value.id, data)
      ElMessage.success('修改成功')
    } else {
      await createCustomsAuth(data)
      ElMessage.success('新增成功')
    }

    showDialog.value = false
    Object.assign(form, emptyForm())
    editingAuth.value = null
    await loadAuths()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteCustomsAuth(id)
    ElMessage.success('删除成功')
    await loadAuths()
  } catch { /* handled */ }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style lang="scss" scoped>
.customs-auths {
  padding: 4px 0;
}

.auths-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}

.auth-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .auth-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .auth-account {
      color: #606266;
      font-size: 13px;
    }

    .auth-notes {
      color: #909399;
      font-size: 12px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-time {
      color: #c0c4cc;
      font-size: 12px;
    }
  }

  .auth-actions {
    display: flex;
    gap: 4px;
  }
}

.inline-upload {
  display: flex;
  align-items: center;
  gap: 12px;

  .uploaded-name {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #67C23A;
    font-size: 13px;
  }
}
</style>
