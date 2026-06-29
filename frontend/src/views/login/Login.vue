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
    router.push(redirect)
  } catch (err) {
    console.error('Login failed:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0c2d4e 0%, #1a5276 30%, #1f6f8b 60%, #2d98b9 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at 20% 80%, rgba(41,128,185,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(52,152,219,0.1) 0%, transparent 50%);
  }
}

.login-card {
  position: relative;
  width: 420px;
  padding: 48px 40px 36px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);

  .login-logo {
    text-align: center;
    margin-bottom: 36px;

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 88px;
      height: 88px;
      background: linear-gradient(135deg, #1a5276, #2d98b9);
      border-radius: 50%;
      color: #fff;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px rgba(26, 82, 118, 0.3);
    }

    .system-name {
      font-size: 30px;
      font-weight: 800;
      color: #1a3c52;
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
      background: linear-gradient(135deg, #1a5276, #2d98b9);
      border: none;
      &:hover {
        background: linear-gradient(135deg, #154360, #2471a3);
      }
    }
  }

  .register-link {
    text-align: center;
    margin-top: 20px;
    font-size: 14px;
    color: #909399;

    a {
      color: #2d98b9;
      font-weight: 600;
      text-decoration: none;
      &:hover { color: #1a5276; }
    }
  }
}

.login-footer {
  position: relative;
  margin-top: 32px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
</style>
