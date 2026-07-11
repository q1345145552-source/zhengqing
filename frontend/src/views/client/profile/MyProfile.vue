<template>
  <div class="client-page my-profile">
    <div class="profile-header">
      <h2>
        <el-icon><FolderOpened /></el-icon>
        我的资料
      </h2>
      <p class="profile-desc">提前录入公司资料和报关授权信息，走货时可直接选用，无需重复上传。</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="公司资料" name="company">
        <template #label>
          <span><el-icon><OfficeBuilding /></el-icon> 公司资料</span>
        </template>
        <CompanyDocs ref="companyDocsRef" />
      </el-tab-pane>

      <el-tab-pane label="报关授权" name="customs">
        <template #label>
          <span><el-icon><Stamp /></el-icon> 报关授权</span>
        </template>
        <CustomsAuths ref="customsAuthsRef" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CompanyDocs from './CompanyDocs.vue'
import CustomsAuths from './CustomsAuths.vue'

const activeTab = ref('company')
</script>

<style lang="scss" scoped>
.my-profile {
  max-width: 900px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: 20px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 22px;
    color: #303133;
    margin: 0 0 8px;
  }

  .profile-desc {
    color: #909399;
    font-size: 14px;
    margin: 0;
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .profile-header { padding: 16px; }
  .el-tabs__header { overflow-x: auto; }
}
</style>
