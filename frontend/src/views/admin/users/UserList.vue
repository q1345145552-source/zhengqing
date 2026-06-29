<template>
  <div class="user-list">
    <div class="page-header">
      <h2><el-icon><UserFilled /></el-icon> 用户管理</h2>
      <el-button type="primary" @click="openDialog(null)"><el-icon><Plus /></el-icon> 新增用户</el-button>
    </div>

    <el-table :data="users" stripe v-loading="loading" empty-text="暂无用户">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="130" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'employee' ? 'warning' : 'success'" size="small">
            {{ roleLabel(row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 'active'"
            active-text="启用"
            inactive-text="禁用"
            @change="(val) => toggleStatus(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">{{ format(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openDialog(row)"><el-icon><Edit /></el-icon> 编辑</el-button>
          <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
            <template #reference><el-button size="small" text type="danger"><el-icon><Delete /></el-icon> 删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="show" :title="editing ? '编辑用户' : '新增用户'" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" :prop="editing ? null : 'password'">
          <el-input v-model="form.password" type="password" show-password :placeholder="editing ? '留空则不修改' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width:100%">
            <el-option label="客户" value="client" />
            <el-option label="员工" value="employee" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="选填" />
        </el-form-item>
        <el-form-item v-if="editing" label="状态">
          <el-switch v-model="form.status" active-value="active" inactive-value="disabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="show = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ editing ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const users = ref([])
const loading = ref(false)
const show = ref(false)
const editing = ref(null)
const saving = ref(false)
const formRef = ref(null)

const form = reactive({ username: '', password: '', role: 'client', email: '', status: 'active' })
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: editing.value ? [] : [{ required: true, message: '请输入密码' }],
  role: [{ required: true, message: '请选择角色' }],
}

onMounted(loadUsers)
async function loadUsers() {
  loading.value = true
  try { const res = await request.get('/admin/users'); users.value = res.data || [] }
  catch { /* handled */ }
  finally { loading.value = false }
}

function openDialog(user) {
  editing.value = user
  if (user) {
    form.username = user.username; form.role = user.role; form.email = user.email || ''; form.status = user.status; form.password = ''
  } else {
    form.username = ''; form.password = ''; form.role = 'client'; form.email = ''; form.status = 'active'
  }
  show.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const data = { username: form.username, role: form.role, email: form.email || null }
    if (form.password) data.password = form.password
    if (editing.value) {
      data.status = form.status
      await request.put(`/admin/users/${editing.value.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/admin/users', data)
      ElMessage.success('创建成功')
    }
    show.value = false
    loadUsers()
  } catch { /* handled */ }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try { await request.delete(`/admin/users/${id}`); ElMessage.success('已删除'); loadUsers() }
  catch { /* handled */ }
}

async function toggleStatus(user, active) {
  try {
    await request.put(`/admin/users/${user.id}`, { status: active ? 'active' : 'disabled' })
    user.status = active ? 'active' : 'disabled'
    ElMessage.success(active ? '已启用' : '已禁用')
  } catch { /* handled */ }
}

function roleLabel(r) { return ({ client: '客户', employee: '员工', admin: '管理员' })[r] || r }
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>
<style scoped>
.user-list { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
</style>
