<template>
  <div class="company-docs">
    <!-- 已保存的公司资料列表 -->
    <div v-if="docs.length > 0" class="docs-list">
      <div
        v-for="doc in docs"
        :key="doc.id"
        class="doc-card"
      >
        <div class="doc-info">
          <el-tag type="primary" size="small">{{ doc.company_name || '未命名' }}</el-tag>
          <span class="doc-address">{{ doc.thai_address || '暂无地址' }}</span>
          <span class="doc-time">{{ formatDate(doc.updated_at) }}</span>
        </div>
        <div class="doc-actions">
          <el-button size="small" text type="primary" @click="editDoc(doc)">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-popconfirm title="确定删除该资料？" @confirm="handleDelete(doc.id)">
            <template #reference>
              <el-button size="small" text type="danger">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无公司资料，点击下方按钮新增" :image-size="80" />

    <!-- 新增按钮 -->
    <div style="margin-top: 20px; text-align: center">
      <el-button type="primary" @click="showDialog = true; editingDoc = null">
        <el-icon><Plus /></el-icon> 新增公司资料
      </el-button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="editingDoc ? '编辑公司资料' : '新增公司资料'"
      width="650px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="公司名称" prop="company_name">
          <el-input v-model="form.company_name" placeholder="泰国注册公司全称" maxlength="200" />
        </el-form-item>

        <el-form-item label="泰国地址" prop="thai_address">
          <el-input v-model="form.thai_address" type="textarea" :rows="2" placeholder="省/市/区/详细地址" maxlength="500" />
        </el-form-item>

        <el-form-item label="公司税号 (TAX ID)">
          <el-input v-model="form.tax_id" placeholder="泰国公司税号（选填）" maxlength="50" />
        </el-form-item>

        <el-form-item label="法人信息">
          <el-row :gutter="12">
            <el-col :span="8">
              <el-input v-model="form.legal_rep_info.name" placeholder="法人姓名" />
            </el-col>
            <el-col :span="8">
              <el-input v-model="form.legal_rep_info.passport_no" placeholder="护照号" />
            </el-col>
            <el-col :span="8">
              <el-input v-model="form.legal_rep_info.phone" placeholder="联系电话" />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="DBD（公司注册证明）">
          <div class="inline-upload">
            <el-button size="small" plain @click="$refs.dbdDialogInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <div v-if="form.dbd_file.length > 0" class="file-list">
              <div v-for="(f, idx) in form.dbd_file" :key="idx" class="file-item">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                <span class="uploaded-name">{{ f.original_name }}</span>
                <el-button type="danger" size="small" @click="removeFile('dbd_file', idx)" :disabled="uploading">删除</el-button>
              </div>
            </div>
            <input ref="dbdDialogInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'dbd_file')" multiple />
          </div>
        </el-form-item>

        <el-form-item label="PP.20（增值税登记证）">
          <div class="inline-upload">
            <el-button size="small" plain @click="$refs.pp20DialogInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <div v-if="form.pp20_file.length > 0" class="file-list">
              <div v-for="(f, idx) in form.pp20_file" :key="idx" class="file-item">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                <span class="uploaded-name">{{ f.original_name }}</span>
                <el-button type="danger" size="small" @click="removeFile('pp20_file', idx)" :disabled="uploading">删除</el-button>
              </div>
            </div>
            <input ref="pp20DialogInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'pp20_file')" multiple />
          </div>
        </el-form-item>

        <el-form-item label="公司印章">
          <div class="inline-upload">
            <el-button size="small" plain @click="$refs.stampDialogInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <div v-if="form.company_stamp_file.length > 0" class="file-list">
              <div v-for="(f, idx) in form.company_stamp_file" :key="idx" class="file-item">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                <span class="uploaded-name">{{ f.original_name }}</span>
                <el-button type="danger" size="small" @click="removeFile('company_stamp_file', idx)" :disabled="uploading">删除</el-button>
              </div>
            </div>
            <input ref="stampDialogInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'company_stamp_file')" multiple />
          </div>
        </el-form-item>

        <el-form-item label="董事护照复印件">
          <div class="inline-upload">
            <el-button size="small" plain @click="$refs.passDialogInput.click()" :disabled="uploading">
              <el-icon><Upload /></el-icon> 上传文件
            </el-button>
            <div v-if="form.director_passport_file.length > 0" class="file-list">
              <div v-for="(f, idx) in form.director_passport_file" :key="idx" class="file-item">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                <span class="uploaded-name">{{ f.original_name }}</span>
                <el-button type="danger" size="small" @click="removeFile('director_passport_file', idx)" :disabled="uploading">删除</el-button>
              </div>
            </div>
            <input ref="passDialogInput" type="file" accept=".pdf,.jpg,.jpeg,.png" hidden @change="(e) => handleDialogUpload(e, 'director_passport_file')" multiple />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ editingDoc ? '保存修改' : '确认新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCompanyDocs, createCompanyDoc, updateCompanyDoc, deleteCompanyDoc, uploadProfileFile } from '@/api/clientProfile'
import { ElMessage } from 'element-plus'

const docs = ref([])
const showDialog = ref(false)
const editingDoc = ref(null)
const saving = ref(false)
const uploading = ref(false)
const formRef = ref(null)

const emptyForm = () => ({
  company_name: '',
  tax_id: '',
  thai_address: '',
  legal_rep_info: { name: '', passport_no: '', phone: '' },
  dbd_file: null,
  pp20_file: null,
  company_stamp_file: null,
  director_passport_file: null,
})

const form = reactive(emptyForm())

const rules = {
  company_name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
  thai_address: [{ required: true, message: '请输入泰国地址', trigger: 'blur' }],
}

onMounted(() => loadDocs())

async function loadDocs() {
  try {
    const res = await getCompanyDocs()
    docs.value = res.data || []
  } catch { /* handled in request interceptor */ }
}

function editDoc(doc) {
  editingDoc.value = doc
  form.company_name = doc.company_name || ''
  form.thai_address = doc.thai_address || ''
  form.tax_id = doc.tax_id || ''
  form.dbd_file = normalizeFiles(doc.dbd_file)
  form.pp20_file = normalizeFiles(doc.pp20_file)
  form.company_stamp_file = normalizeFiles(doc.company_stamp_file)
  form.director_passport_file = normalizeFiles(doc.director_passport_file)
  form.legal_rep_info = doc.legal_rep_info && typeof doc.legal_rep_info === 'object'
    ? { ...doc.legal_rep_info }
    : { name: '', passport_no: '', phone: '' }
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
        form[field].push({
          original_name: res.data.original_name,
          stored_path: res.data.stored_path,
          url: res.data.url,
          mime_type: res.data.mime_type,
          size: res.data.size,
        })
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
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const data = {
      company_name: form.company_name,
      thai_address: form.thai_address,
      tax_id: form.tax_id,
      legal_rep_info: form.legal_rep_info,
      dbd_file: form.dbd_file.length > 0 ? form.dbd_file : null,
      pp20_file: form.pp20_file.length > 0 ? form.pp20_file : null,
      company_stamp_file: form.company_stamp_file.length > 0 ? form.company_stamp_file : null,
      director_passport_file: form.director_passport_file.length > 0 ? form.director_passport_file : null,
    }

    if (editingDoc.value) {
      await updateCompanyDoc(editingDoc.value.id, data)
      ElMessage.success('修改成功')
    } else {
      await createCompanyDoc(data)
      ElMessage.success('新增成功')
    }

    showDialog.value = false
    Object.assign(form, emptyForm())
    editingDoc.value = null
    await loadDocs()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id) {
  try {
    await deleteCompanyDoc(id)
    ElMessage.success('删除成功')
    await loadDocs()
  } catch { /* handled */ }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style lang="scss" scoped>
.company-docs {
  padding: 4px 0;
}

.docs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}

.doc-card {
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

  .doc-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .doc-address {
      color: #606266;
      font-size: 13px;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-time {
      color: #c0c4cc;
      font-size: 12px;
    }
  }

  .doc-actions {
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
.file-list { margin-top: 8px; }
.file-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; margin-bottom: 4px; background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 6px; }
.file-item .file-name { flex: 1; font-size: 13px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
