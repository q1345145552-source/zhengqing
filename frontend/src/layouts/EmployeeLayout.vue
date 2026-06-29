<template>
  <div class="employee-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="employee-sidebar">
      <div class="sidebar-logo">
        <el-icon :size="24" color="#fff"><OfficeBuilding /></el-icon>
        <span v-show="!isCollapse" class="logo-text">正清·工作台</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/employee/dashboard">
          <el-icon><Monitor /></el-icon>
          <template #title>工作台</template>
        </el-menu-item>

        <el-menu-item index="/employee/review">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>客户申请</template>
        </el-menu-item>

        <el-menu-item index="/employee/client-review">
          <el-icon><UserFilled /></el-icon>
          <template #title>客户审核</template>
        </el-menu-item>

        <el-menu-item index="/employee/review-history">
          <el-icon><Notebook /></el-icon>
          <template #title>审核记录</template>
        </el-menu-item>

        <el-menu-item index="/employee/deposit-review">
          <el-icon><Money /></el-icon>
          <template #title>充值审核</template>
        </el-menu-item>

        <el-menu-item index="/employee/tracking">
          <el-icon><Ship /></el-icon>
          <template #title>货物追踪</template>
        </el-menu-item>

        <el-menu-item index="/employee/pending-charge">
          <el-icon><WarningFilled /></el-icon>
          <template #title>待扣款确认</template>
        </el-menu-item>

        <el-menu-item index="/employee/fee-estimate">
          <el-icon><Money /></el-icon>
          <template #title>费用预估</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容区 -->
    <div class="employee-right">
      <!-- 顶部栏 -->
      <el-header class="employee-topbar">
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
            <el-breadcrumb-item :to="{ path: '/employee/review' }">{{ $t("nav.review") }}</el-breadcrumb-item>
            <el-breadcrumb-item v-if="route.meta.title && !route.meta.hidden">{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="topbar-right">
          <LangSwitch />
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="notification-badge" style="cursor:pointer" @click="router.push('/employee/review')">
            <el-icon :size="20"><Bell /></el-icon>
          </el-badge>
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="30" icon="UserFilled" />
              <span class="username">{{ authStore.username }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <span style="color: #F56C6C">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="employee-main">
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
    ElMessageBox.confirm(i18n.global.t('common.logout'), '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
.employee-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.employee-sidebar {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;

  .sidebar-logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.employee-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.employee-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
  height: 50px;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .notification-badge {
      cursor: pointer;
    }

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

.employee-main {
  flex: 1;
  overflow-y: auto;
  background: #f0f2f5;
  padding: 20px;
}
</style>
