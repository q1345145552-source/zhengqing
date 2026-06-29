<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-logo">
        <div class="logo-icon">
          <el-icon :size="48"><Ship /></el-icon>
        </div>
        <h1 class="system-name">湘泰出海</h1>
        <p class="system-desc">创建您的账户</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="register-form"
        @keyup.enter="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名（3-50个字符）"
            size="large"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱地址（选填）"
            size="large"
            :prefix-icon="Message"
            clearable
          />
        </el-form-item>

        <el-form-item prop="real_name">
          <el-input
            v-model="form.real_name"
            placeholder="公司名称（选填）"
            size="large"
            :prefix-icon="OfficeBuilding"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
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
            class="register-btn"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注 册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-link">
        已有账号？
        <router-link to="/login">返回登录</router-link>
      </div>
    </div>

    <div class="register-footer">
      <span>湘泰出海 © {{ new Date().getFullYear() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, OfficeBuilding } from '@element-plus/icons-vue'
import request from '@/api/request'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  email: '',
  real_name: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度需要3-50个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await request.post('/auth/register', {
      username: form.username,
      password: form.password,
      email: form.email || undefined,
      real_name: form.real_name || undefined,
    })
    ElMessage.success('注册成功，请等待管理员审核您的账号')
    setTimeout(function() { router.push('/login') }, 1500)
  } catch (err) {
    console.error('Register failed:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.register-page {
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
    top: 0; left: 0; right: 0; bottom: 0;
    background:
      radial-gradient(ellipse at 20% 80%, rgba(41,128,185,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(52,152,219,0.1) 0%, transparent 50%);
  }
}

.register-card {
  position: relative;
  width: 440px;
  padding: 40px 40px 32px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);

  .register-logo {
    text-align: center;
    margin-bottom: 32px;

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #1a5276, #2d98b9);
      border-radius: 50%;
      color: #fff;
      margin-bottom: 12px;
      box-shadow: 0 6px 20px rgba(26, 82, 118, 0.3);
    }

    .system-name {
      font-size: 26px;
      font-weight: 800;
      color: #1a3c52;
      margin: 0 0 4px;
      letter-spacing: 4px;
    }

    .system-desc {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
    }
  }

  .register-form {
    .register-btn {
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

  .login-link {
    text-align: center;
    margin-top: 16px;
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

.register-footer {
  position: relative;
  margin-top: 28px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
</style>
