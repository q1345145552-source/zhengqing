<template>
  <div class="price-rules">
    <div class="page-header">
      <h2><el-icon><Money /></el-icon> 价格规则管理</h2>
      <el-button type="primary" @click="openAdd"><el-icon><Plus /></el-icon> 新增服务</el-button>
    </div>

    <el-table :data="rules" stripe v-loading="loading">
      <el-table-column prop="fee_name" label="服务名称" min-width="180" />
      <el-table-column label="单价(฿)" width="130">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-input-number v-model="editPrice" :min="0" :precision="2" size="small" style="width:100px" />
          </template>
          <template v-else>{{ row.unit_price }}</template>
        </template>
      </el-table-column>
      <el-table-column label="单位" width="100">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-select v-model="editUnit" size="small" style="width:90px">
              <el-option label="每单" value="fixed" /><el-option label="每m³" value="per_cbm" />
              <el-option label="每kg" value="per_kg" /><el-option label="每托" value="per_pallet" />
            </el-select>
          </template>
          <template v-else>{{ unitLabel(row.unit) }}</template>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="160" show-overflow-tooltip />
      <el-table-column label="路线" width="150" show-overflow-tooltip>
        <template #default="{ row }">{{ routeLabel(row.route) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.is_active" @change="(v) => toggleActive(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="editingId === row.id">
            <el-button size="small" type="primary" @click="saveEdit(row)">保存</el-button>
            <el-button size="small" @click="editingId = null">取消</el-button>
          </template>
          <template v-else>
            <el-button size="small" text type="primary" @click="startEdit(row)">编辑</el-button>
            <el-button size="small" text type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增弹窗 -->
    <el-dialog v-model="showAdd" title="新增价格规则" width="480px" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="服务名称" required><el-input v-model="addForm.fee_name" placeholder="例如：保险费" /></el-form-item>
        <el-form-item label="识别码" required><el-input v-model="addForm.fee_type" placeholder="例如：insurance（英文唯一）" /></el-form-item>
        <el-form-item label="单价"><el-input-number v-model="addForm.unit_price" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="单位">
          <el-select v-model="addForm.unit" style="width:100%">
            <el-option label="每单（固定）" value="fixed" /><el-option label="每立方米" value="per_cbm" />
            <el-option label="每公斤" value="per_kg" /><el-option label="每托" value="per_pallet" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属路线">
          <el-select v-model="addForm.route" clearable placeholder="空=通用服务" style="width:100%">
            <el-option label="通用（不区分路线）" value="" />
            <el-option label="南宁→曼谷" value="nanning_bangkok" />
            <el-option label="广州深圳→曼谷" value="guangzhou_bangkok" />
            <el-option label="义乌→曼谷" value="yiwu_bangkok" />
          </el-select>
        </el-form-item>
        <el-form-item label="说明"><el-input v-model="addForm.description" placeholder="价格说明" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPriceRules, updatePriceRule, createPriceRule, deletePriceRule } from '@/api/finance'
import { ElMessage, ElMessageBox } from 'element-plus'

const rules = ref([])
const loading = ref(false)
const editingId = ref(null)
const editPrice = ref(0)
const editUnit = ref('')

const showAdd = ref(false)
const adding = ref(false)
const addForm = reactive({ fee_type: '', fee_name: '', unit: 'fixed', unit_price: 0, description: '', route: '' })

onMounted(loadRules)

async function loadRules() {
  loading.value = true
  try { const res = await getPriceRules(); rules.value = res.data || [] }
  catch { /* */ }
  finally { loading.value = false }
}

function startEdit(rule) {
  editingId.value = rule.id
  editPrice.value = parseFloat(rule.unit_price)
  editUnit.value = rule.unit
}

async function saveEdit(rule) {
  try {
    await updatePriceRule(rule.id, { unit_price: editPrice.value, unit: editUnit.value })
    rule.unit_price = editPrice.value
    rule.unit = editUnit.value
    editingId.value = null
    ElMessage.success('已更新')
  } catch { /* */ }
}

async function toggleActive(rule, active) {
  try {
    await updatePriceRule(rule.id, { is_active: active })
    rule.is_active = active
  } catch { /* */ }
}

function openAdd() {
  Object.assign(addForm, { fee_type: '', fee_name: '', unit: 'fixed', unit_price: 0, description: '', route: '' })
  showAdd.value = true
}

async function handleAdd() {
  if (!addForm.fee_type || !addForm.fee_name) { ElMessage.warning('请填写识别码和服务名称'); return }
  adding.value = true
  try {
    await createPriceRule({ ...addForm, route: addForm.route || null })
    ElMessage.success('新增成功')
    showAdd.value = false
    await loadRules()
  } catch { /* */ }
  finally { adding.value = false }
}

async function handleDelete(rule) {
  try {
    await ElMessageBox.confirm(`确定删除「${rule.fee_name}」？删除后不可恢复。`, '确认删除', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' })
  } catch { return }
  try {
    await deletePriceRule(rule.id)
    ElMessage.success('已删除')
    await loadRules()
  } catch { /* */ }
}

function unitLabel(u) {
  return ({ fixed: '每单', per_cbm: '每m³', per_kg: '每kg', per_pallet: '每托' })[u] || u
}
function routeLabel(r) {
  return ({ nanning_bangkok: '南宁→曼谷', guangzhou_bangkok: '广州深圳→曼谷', yiwu_bangkok: '义乌→曼谷' })[r] || (r || '通用')
}
</script>

<style scoped>
.price-rules { max-width: 1100px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h2 { display: flex; align-items: center; gap: 8px; font-size: 22px; margin: 0; }
</style>
