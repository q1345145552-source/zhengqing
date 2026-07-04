<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon :size="26" color="#fff"><Setting /></el-icon>
        <span v-show="!isCollapse" class="logo-text">{{ $t("nav.adminHome") }}</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="transparent"
        text-color="#b0bec5"
        active-text-color="#4fc3f7"
        router
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>{{ $t("nav.adminHome") }}首页</template>
        </el-menu-item>

        <el-menu-item index="/admin/submissions">
          <el-icon><List /></el-icon>
          <template #title>所有申请</template>
        </el-menu-item>

        <el-menu-item index="/admin/tracking">
          <el-icon><Ship /></el-icon>
          <template #title>货物追踪</template>
        </el-menu-item>

        <el-menu-item index="/admin/employees">
          <el-icon><User /></el-icon>
          <template #title>员工管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/customers">
          <el-icon><UserFilled /></el-icon>
          <template #title>客户管理</template>
        </el-menu-item>

        <el-menu-item index="/admin/finance/price-rules">
          <el-icon><Money /></el-icon>
          <template #title>价格规则</template>
        </el-menu-item>

        <el-menu-item index="/admin/settings">
          <el-icon><Tools /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <div class="admin-right">
      <el-header class="admin-topbar">
        <div class="topbar-left">
          <el-icon
            :size="22"
            style="cursor: pointer"
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">{{ $t("nav.adminHome") }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" style="margin-right:8px">
            <el-icon :size="20" style="cursor:pointer" @click="router.push('/admin/submissions')"><Bell /></el-icon>
          </el-badge>
          <LangSwitch />
          <el-tag type="danger" size="small" effect="dark">管理员</el-tag>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="30" icon="UserFilled" />
              <span class="username">{{ authStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">{{ $t("common.profile") }}</el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <span style="color: #F56C6C">{{ $t("common.logout") }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import LangSwitch from '@/components/LangSwitch.vue'
import i18n from '@/locales'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapse = ref(false)
const unreadCount = ref(0)
let countTimer = null

onMounted(() => { fetchUnread(); countTimer = setInterval(fetchUnread, 30000) })
onUnmounted(() => { clearInterval(countTimer) })

async function fetchUnread() {
  try { const res = await request.get('/finance/notifications/unread-count'); unreadCount.value = res.data?.count || 0 } catch { /* */ }
}

const activeMenu = computed(() => route.path)

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm(`确定要${i18n.global.t('common.logout')}吗？`, '提示', {
      confirmButtonText: i18n.global.t('common.confirm'),
      cancelButtonText: i18n.global.t('common.cancel'),
      type: 'warning',
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {
      authStore.logout()
      router.push('/login')
    })
  }
}
</script>

<style lang="scss" scoped>
// ==========================================
// 物流行业风格 — 管理后台布局
// ==========================================
$brand-deep: #0d2137;
$brand-navy: #132b44;

.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.admin-sidebar {
  background: linear-gradient(180deg, #0a1a2e 0%, $brand-deep 40%, #12273d 100%);
  transition: width 0.3s;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.05);

  .sidebar-logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.15);

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      letter-spacing: 1px;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.admin-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.admin-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: 0 20px;
  height: 50px;
  border-bottom: 1px solid #e8ecf0;
  z-index: 10;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;

      .username {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

.admin-main {
  flex: 1;
  overflow-y: auto;
  // 浅色物流纹理背景
  background:
    linear-gradient(180deg, #f4f6f9 0%, #eef1f5 100%);
  padding: 20px;
}
</style>
