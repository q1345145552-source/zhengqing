<template>
  <div class="login-page">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <el-icon :size="56"><Ship /></el-icon>
        </div>
        <h1 class="system-name">湘泰出海</h1>
        <p class="system-desc">一站式物流清关管理平台</p>
      </div>

      <!-- 表单 -->
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册入口 -->
      <div class="register-link">
        还没有账号？
        <router-link to="/register">立即注册</router-link>
      </div>
    </div>

    <div class="login-footer">
      <span>湘泰出海 © {{ new Date().getFullYear() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const user = await authStore.login(loginForm.username, loginForm.password)
    ElMessage.success('欢迎回来，' + user.username + '！')
    const redirect = route.query.redirect || authStore.homePage
    console.log('[Login] redirect to:', redirect, 'role:', user.role)
    await router.push(redirect).catch((navErr) => {
      // 路由导航失败，用全页刷新兜底确保登录成功
      console.error('[Login] Navigation failed, fallback to location:', navErr)
      window.location.href = redirect
    })
  } catch (err) {
    console.error('Login failed:', err)
    ElMessage.error('登录失败：' + (err.message || '请检查账号密码'))
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
// ==========================================
// 物流行业风格登录页
// ==========================================

$brand-deep: #0d2137;
$brand-navy: #132b44;
$brand-ocean: #1a5276;
$brand-teal: #1f6f8b;

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  // 深海蓝渐变基底
  background: linear-gradient(160deg, #091a2e 0%, $brand-deep 25%, $brand-navy 50%, #162d45 75%, #0f2840 100%);
  position: relative;
  overflow: hidden;

  // === 航线网格（物流路线图抽象图案） ===
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.12;
    background-image:
      // 水平航线
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 59px,
        rgba(100, 180, 220, 0.4) 59px,
        rgba(100, 180, 220, 0.4) 60px
      ),
      // 垂直航线
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 59px,
        rgba(100, 180, 220, 0.4) 59px,
        rgba(100, 180, 220, 0.4) 60px
      ),
      // 斜向路线（45度，模拟航线交叉）
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 83px,
        rgba(80, 160, 200, 0.25) 83px,
        rgba(80, 160, 200, 0.25) 84px
      ),
      // 反向斜线
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 83px,
        rgba(80, 160, 200, 0.25) 83px,
        rgba(80, 160, 200, 0.25) 84px
      );
  }

  // === 光晕点缀 ===
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      // 左上角大光晕 — 模拟港口灯光
      radial-gradient(ellipse 600px 400px at 15% 10%, rgba(41, 128, 185, 0.18) 0%, transparent 70%),
      // 右下角光晕 — 模拟航线终点
      radial-gradient(ellipse 500px 350px at 85% 90%, rgba(26, 188, 156, 0.12) 0%, transparent 70%),
      // 中心微光
      radial-gradient(circle 300px at 50% 40%, rgba(52, 152, 219, 0.08) 0%, transparent 60%);
    pointer-events: none;
  }

  // === 浮动集装箱方块装饰 ===
  .container-block {
    position: absolute;
    border: 1.5px solid rgba(100, 180, 220, 0.3);
    border-radius: 3px;
    background: rgba(20, 60, 100, 0.15);
    pointer-events: none;
  }
}

.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 48px 40px 36px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 16px;
  box-shadow:
    0 4px 6px rgba(0, 0, 0, 0.07),
    0 24px 80px rgba(9, 26, 46, 0.35);
  backdrop-filter: blur(10px);
  // 顶部品牌色条
  border-top: 4px solid $brand-navy;

  .login-logo {
    text-align: center;
    margin-bottom: 36px;

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 88px;
      height: 88px;
      background: linear-gradient(135deg, #0d2137, #1a5276, #1f6f8b);
      border-radius: 50%;
      color: #fff;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(13, 33, 55, 0.35);
    }

    .system-name {
      font-size: 30px;
      font-weight: 800;
      color: #0d2137;
      margin: 0 0 6px;
      letter-spacing: 4px;
    }

    .system-desc {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
      letter-spacing: 1px;
    }
  }

  .login-form {
    .login-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      letter-spacing: 8px;
      background: linear-gradient(135deg, #0d2137, #1a5276);
      border: none;
      border-radius: 8px;
      transition: all 0.3s;
      &:hover {
        background: linear-gradient(135deg, #132b44, #1f6f8b);
        box-shadow: 0 4px 16px rgba(13, 33, 55, 0.4);
        transform: translateY(-1px);
      }
    }
  }

  .register-link {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #909399;

    a {
      color: #1a5276;
      font-weight: 600;
      text-decoration: none;
      &:hover { color: #0d2137; }
    }
  }
}

.login-footer {
  position: relative;
  z-index: 10;
  margin-top: 32px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}
</style>
