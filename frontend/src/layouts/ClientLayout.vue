<template>
  <div class="client-layout">
    <!-- 顶部导航栏 -->
    <el-header class="client-header">
      <div class="header-left">
        <el-icon :size="28" color="#409EFF"><Ship /></el-icon>
        <span class="system-title">湘泰正清系统</span>
      </div>
      <div class="header-right">
        <el-button size="default" @click="handleNav('/client/dashboard')">
          <el-icon><HomeFilled /></el-icon>
          {{ $t("nav.home") }}
        </el-button>
        <el-button size="default" @click="handleNav('/client/profile')">
          <el-icon><FolderOpened /></el-icon>
          {{ $t("nav.profile") }}
        </el-button>
        <el-button size="default" @click="handleNav('/client/submissions')">
          <el-icon><Document /></el-icon>
          {{ $t("nav.applications") }}
        </el-button>
        <el-button size="default" @click="handleNav('/client/wallet')">
          <el-icon><Coin /></el-icon>
          {{ $t("nav.wallet") }}
        </el-button>
        <el-button size="default" @click="handleNav('/client/prices')">
          <el-icon><Money /></el-icon>
          {{ $t("nav.prices") }}
        </el-button>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
          <el-button size="default" @click="handleNav('/client/notifications')">
            <el-icon><Bell /></el-icon>
          </el-button>
        </el-badge>
        <LangSwitch />
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
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
    <el-main class="client-main">
      <router-view />
    </el-main>

    <!-- 底部 -->
    <el-footer class="client-footer">
      <span>© 2024 正清系统 - 物流清关管理平台</span>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessageBox } from 'element-plus'
import request from '@/api/request'
import LangSwitch from '@/components/LangSwitch.vue'

const router = useRouter()
const authStore = useAuthStore()
const unreadCount = ref(0)
let countTimer = null

onMounted(() => { fetchUnread(); countTimer = setInterval(fetchUnread, 30000) })
onUnmounted(() => { clearInterval(countTimer) })

async function fetchUnread() {
  try { const res = await request.get('/finance/notifications/unread-count'); unreadCount.value = res.data?.count || 0 } catch { /* */ }
}

function handleNav(path) {
  router.push(path)
}

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要{{ $t("common.logout") }}吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(() => {
      authStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    router.push('/client/profile')
  }
}
</script>

<style lang="scss" scoped>
.client-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 24px;
  height: 60px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .system-title {
      font-size: 20px;
      font-weight: 700;
      color: #303133;
      letter-spacing: 1px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.2s;

      &:hover {
        background: #f5f7fa;
      }

      .username {
        font-size: 14px;
        color: #606266;
      }
    }
  }
}

.client-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.client-footer {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}
</style>
