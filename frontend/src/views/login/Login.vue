<template>
  <div class="login-page">
    <div class="login-card">
      <!-- logo 区 -->
      <div class="login-logo">
        <el-icon :size="48" color="#409EFF"><Ship /></el-icon>
        <h1 class="system-name">湘泰正清系统</h1>
        <p class="system-desc">物流清关管理平台</p>
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

      <!-- 提示 -->
      <div class="login-tips">
        <el-collapse>
          <el-collapse-item title="测试账号（点击展开）" name="1">
            <div class="test-accounts">
              <div class="account-row">
                <el-tag type="danger" size="small">管理员</el-tag>
                <span>admin / admin123</span>
              </div>
              <div class="account-row">
                <el-tag type="warning" size="small">员工</el-tag>
                <span>employee / employee123</span>
              </div>
              <div class="account-row">
                <el-tag type="success" size="small">客户</el-tag>
                <span>client / client123</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
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
  username: 'admin',
  password: 'admin123',
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
    ElMessage.success(`欢迎回来，${user.username}！`)

    // 跳转到角色对应的首页
    const redirect = route.query.redirect || authStore.homePage
    router.push(redirect)
  } catch (err) {
    // 错误已在 request 拦截器中处理
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .login-logo {
    text-align: center;
    margin-bottom: 32px;

    .system-name {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin: 12px 0 4px;
    }

    .system-desc {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .login-form {
    .login-btn {
      width: 100%;
    }
  }

  .login-tips {
    margin-top: 16px;

    .test-accounts {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .account-row {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: #606266;
      }
    }
  }
}
</style>
