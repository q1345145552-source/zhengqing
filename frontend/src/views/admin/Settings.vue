<template>
  <div class="settings-page">
    <h2><el-icon><Tools /></el-icon> 系统配置</h2>
    <el-tabs v-model="tab" type="border-card">
      <!-- Tab1: 产品白名单 -->
      <el-tab-pane label="产品白名单" name="whitelist">
        <el-button type="primary" size="small" style="margin-bottom:12px" @click="openWhitelist(null)"><el-icon><Plus /></el-icon> 新增品类</el-button>
        <el-table :data="whitelist" size="small" stripe>
          <el-table-column prop="category_name" label="品类名称" />
          <el-table-column prop="hs_prefix" label="HS编码前缀" width="130" />
          <el-table-column prop="notes" label="备注" min-width="150" />
          <el-table-column label="状态" width="80"><template #default="{row}"><el-tag :type="row.is_active?'success':'info'" size="small">{{ row.is_active?'启用':'停用' }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="140"><template #default="{row}"><el-button size="small" text type="primary" @click="openWhitelist(row)">编辑</el-button><el-button size="small" text type="danger" @click="delWhitelist(row.id)">删除</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab2: 仓库地址 -->
      <el-tab-pane label="仓库地址" name="warehouse">
        <el-button type="primary" size="small" style="margin-bottom:12px" @click="openWh(null)"><el-icon><Plus /></el-icon> 新增仓库</el-button>
        <el-table :data="warehouses" size="small" stripe>
          <el-table-column prop="name" label="仓库名称" min-width="180" />
          <el-table-column label="区域" width="80"><template #default="{row}">{{ row.country==='china'?'中国':'泰国' }}</template></el-table-column>
          <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
          <el-table-column prop="contact_person" label="联系人" width="90" />
          <el-table-column prop="contact_phone" label="电话" width="140" />
          <el-table-column label="状态" width="70"><template #default="{row}"><el-tag :type="row.is_active?'success':'info'" size="small">{{ row.is_active?'启用':'停用' }}</el-tag></template></el-table-column>
          <el-table-column label="操作" width="140"><template #default="{row}"><el-button size="small" text type="primary" @click="openWh(row)">编辑</el-button><el-button size="small" text type="danger" @click="delWidget('warehouses',row.id)">删除</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab3: 资料模板 -->
      <el-tab-pane label="资料模板" name="doc">
        <el-radio-group v-model="cargoType" size="small" style="margin-bottom:12px" @change="loadDocTemplates">
          <el-radio-button value="general">普货模板</el-radio-button>
          <el-radio-button value="sensitive">敏感货模板</el-radio-button>
        </el-radio-group>
        <el-button type="primary" size="small" style="margin-bottom:12px;margin-left:12px" @click="openDoc(null)"><el-icon><Plus /></el-icon> 新增资料项</el-button>
        <el-table :data="filteredDocs" size="small" stripe>
          <el-table-column prop="file_name" label="文件名称" min-width="180" />
          <el-table-column label="是否必填" width="90"><template #default="{row}"><el-tag :type="row.is_required?'danger':'info'" size="small">{{ row.is_required?'必填':'选填' }}</el-tag></template></el-table-column>
          <el-table-column prop="sort_order" label="排序" width="60" />
          <el-table-column label="操作" width="140"><template #default="{row}"><el-button size="small" text type="primary" @click="openDoc(row)">编辑</el-button><el-button size="small" text type="danger" @click="delDoc(row.id)">删除</el-button></template></el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab4: 审核字段配置 -->
      <el-tab-pane label="审核字段" name="review">
        <el-table :data="reviewConfigs" size="small" stripe>
          <el-table-column prop="step_tab" label="阶段" width="100" />
          <el-table-column prop="field_label" label="字段名称" min-width="200" />
          <el-table-column label="状态" width="100"><template #default="{row}"><el-switch v-model="row.is_enabled" @change="(v)=>toggleReview(row,v)" active-text="开启" inactive-text="关闭" /></template></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 通用编辑弹窗 -->
    <el-dialog v-model="showDialog" :title="dialogTitle" width="450px" destroy-on-close>
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item v-for="f in dialogFields" :key="f.key" :label="f.label">
          <el-input v-if="f.type==='text'" v-model="dialogForm[f.key]" />
          <el-input-number v-if="f.type==='number'" v-model="dialogForm[f.key]" />
          <el-select v-if="f.type==='select'" v-model="dialogForm[f.key]" style="width:100%">
            <el-option v-for="o in f.options" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
          <el-switch v-if="f.type==='switch'" v-model="dialogForm[f.key]" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="showDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="handleDialogSave">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const tab = ref('whitelist'); const cargoType = ref('general')
const whitelist = ref([]); const warehouses = ref([]); const docTemplates = ref([]); const reviewConfigs = ref([])
const showDialog = ref(false); const dialogTitle = ref(''); const saving = ref(false)
const dialogForm = ref({}); const dialogFields = ref([])
let dialogApi = ''; let dialogMethod = 'post'; let dialogId = null

const filteredDocs = computed(() => docTemplates.value.filter(d => d.cargo_type === cargoType.value))

onMounted(() => { loadWhitelist(); loadWarehouses(); loadDocTemplates(); loadReviewConfigs() })

async function loadWhitelist() { try { const r = await request.get('/admin/product-whitelist'); whitelist.value = r.data || [] } catch { /* */ } }
async function loadWarehouses() { try { const r = await request.get('/admin/warehouses'); warehouses.value = r.data || [] } catch { /* */ } }
async function loadDocTemplates() { try { const r = await request.get('/admin/doc-templates'); docTemplates.value = r.data || [] } catch { /* */ } }
async function loadReviewConfigs() { try { const r = await request.get('/admin/review-config'); reviewConfigs.value = r.data || [] } catch { /* */ } }

function openWhitelist(row) {
  dialogApi = '/admin/product-whitelist'; dialogMethod = row ? 'put' : 'post'; dialogId = row?.id
  dialogTitle.value = row ? '编辑品类' : '新增品类'
  dialogFields.value = [
    { key: 'category_name', label: '品类名称', type: 'text' }, { key: 'hs_prefix', label: 'HS编码前缀', type: 'text' },
    { key: 'notes', label: '备注', type: 'text' }, { key: 'is_active', label: '启用', type: 'switch' },
  ]
  dialogForm.value = row ? { ...row } : { category_name: '', hs_prefix: '', notes: '', is_active: true }
  showDialog.value = true
}
function openWh(row) {
  dialogApi = '/admin/warehouses'; dialogMethod = row ? 'put' : 'post'; dialogId = row?.id
  dialogTitle.value = row ? '编辑仓库' : '新增仓库'
  dialogFields.value = [
    { key: 'name', label: '仓库名称', type: 'text' }, { key: 'country', label: '区域', type: 'select', options: [{ label: '中国', value: 'china' }, { label: '泰国', value: 'thailand' }] },
    { key: 'address', label: '地址', type: 'text' }, { key: 'contact_person', label: '联系人', type: 'text' },
    { key: 'contact_phone', label: '电话', type: 'text' }, { key: 'notes', label: '备注', type: 'text' },
  ]
  dialogForm.value = row ? { ...row } : { name: '', country: 'china', address: '', contact_person: '', contact_phone: '', notes: '' }
  showDialog.value = true
}
function openDoc(row) {
  dialogApi = '/admin/doc-templates'; dialogMethod = row ? 'put' : 'post'; dialogId = row?.id
  dialogTitle.value = row ? '编辑资料项' : '新增资料项'
  dialogFields.value = [
    { key: 'cargo_type', label: '货物类型', type: 'select', options: [{ label: '普货', value: 'general' }, { label: '敏感货', value: 'sensitive' }] },
    { key: 'file_name', label: '文件名称', type: 'text' }, { key: 'file_key', label: '字段Key', type: 'text' },
    { key: 'is_required', label: '是否必填', type: 'switch' }, { key: 'sort_order', label: '排序', type: 'number' },
  ]
  dialogForm.value = row ? { ...row } : { cargo_type: 'general', file_name: '', file_key: '', is_required: true, sort_order: 0 }
  showDialog.value = true
}

async function handleDialogSave() {
  saving.value = true
  try {
    if (dialogMethod === 'post') await request.post(dialogApi, dialogForm.value)
    else await request.put(`${dialogApi}/${dialogId}`, dialogForm.value)
    ElMessage.success('保存成功'); showDialog.value = false
    loadWhitelist(); loadWarehouses(); loadDocTemplates()
  } catch { /* */ } finally { saving.value = false }
}

async function delWhitelist(id) { try { await ElMessageBox.confirm('确认删除？') } catch { return }; await request.delete(`/admin/product-whitelist/${id}`); loadWhitelist() }
async function delWidget(table, id) { try { await ElMessageBox.confirm('确认删除？') } catch { return }; await request.delete(`/admin/${table}/${id}`); loadWarehouses() }
async function delDoc(id) { try { await ElMessageBox.confirm('确认删除？') } catch { return }; await request.delete(`/admin/doc-templates/${id}`); loadDocTemplates() }
async function toggleReview(row, v) { try { await request.put(`/admin/review-config/${row.id}`, { is_enabled: v }); ElMessage.success(v ? '已开启' : '已关闭') } catch { row.is_enabled = !v } }
</script>

<style scoped>
.settings-page { max-width: 1000px; margin: 0 auto; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0 0 20px; }
</style>
