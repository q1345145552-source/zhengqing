<template>
  <div class="employee-page">
    <div class="page-header"><h2><el-icon><User /></el-icon> 员工管理</h2><el-button type="primary" @click="openDialog(null)"><el-icon><Plus /></el-icon> 新增员工</el-button></div>
    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="real_name" label="姓名" width="100"><template #default="{row}">{{ row.real_name || '-' }}</template></el-table-column>
      <el-table-column prop="email" label="邮箱" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="row.status==='active'?'success':'danger'" size="small">{{ row.status==='active'?'正常':'禁用' }}</el-tag></template></el-table-column>
      <el-table-column label="创建时间" width="160"><template #default="{row}">{{ format(row.created_at) }}</template></el-table-column>
      <el-table-column label="操作" width="200" fixed="right"><template #default="{row}">
        <el-button size="small" text type="primary" @click="openDialog(row)">编辑</el-button>
        <el-popconfirm :title="row.status==='active'?'确认禁用？':'确认启用？'" @confirm="toggleStatus(row)">
          <template #reference><el-button size="small" text :type="row.status==='active'?'danger':'success'">{{ row.status==='active'?'禁用':'启用' }}</el-button></template>
        </el-popconfirm>
      </template></el-table-column>
    </el-table>

    <el-pagination
      v-if="total > pageSize"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="load"
      style="margin-top:16px;justify-content:flex-end"
    />

    <el-dialog v-model="show" :title="editing?'编辑员工':'新增员工'" width="450px" destroy-on-close>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" required><el-input v-model="form.username" placeholder="登录用户名" /></el-form-item>
        <el-form-item label="姓名" required><el-input v-model="form.real_name" placeholder="员工姓名" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="form.email" placeholder="选填" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" :placeholder="editing?'留空不修改':''" show-password /></el-form-item>
        <el-alert v-if="genPwd" type="success" :closable="false" :title="'初始密码: '+genPwd" style="margin-top:8px" />
      </el-form>
      <template #footer><el-button @click="show=false">取消</el-button><el-button type="primary" :loading="saving" @click="handleSave">{{ editing?'保存':'创建' }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage } from 'element-plus'

const list = ref([]); const loading = ref(false); const show = ref(false); const editing = ref(null); const saving = ref(false); const genPwd = ref('')
const page = ref(1); const pageSize = ref(10); const total = ref(0)
const form = reactive({ username: '', real_name: '', email: '', password: '' })

onMounted(load)
async function load() { loading.value = true; try { const res = await request.get('/admin/employees', { params: { page: page.value, pageSize: pageSize.value } }); list.value = res.data.list || []; total.value = res.data.total || 0 } catch { /* */ } finally { loading.value = false } }
function openDialog(row) {
  editing.value = row; genPwd.value = ''
  if (row) { form.username = row.username; form.real_name = row.real_name || ''; form.email = row.email || ''; form.password = '' }
  else { form.username = ''; form.real_name = ''; form.email = ''; form.password = '' }
  show.value = true
}
async function handleSave() {
  if (!form.username) { ElMessage.warning('请输入用户名'); return }
  saving.value = true
  try {
    const data = { real_name: form.real_name, email: form.email || null }
    if (form.password) data.password = form.password
    if (editing.value) {
      await request.put(`/admin/employees/${editing.value.id}`, data); ElMessage.success('已更新')
    } else {
      const res = await request.post('/admin/employees', { ...data, username: form.username })
      genPwd.value = res.data?.generated_password || ''; ElMessage.success('创建成功')
    }
    if (!editing.value) { await load(); return } // keep dialog open to show password
    show.value = false; load()
  } catch { /* */ } finally { saving.value = false }
}
async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  try { await request.put(`/admin/employees/${row.id}/status`, { status: newStatus }); row.status = newStatus; ElMessage.success(newStatus === 'active' ? '已启用' : '已禁用') }
  catch { /* */ }
}
function format(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }
</script>

<style scoped>
.employee-page { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { display: flex; align-items: center; gap: 8px; font-size: 20px; margin: 0; }
</style>
