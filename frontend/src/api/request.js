import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器 —— 注入 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 —— 统一处理错误
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务错误
    if (res.code && res.code !== 200) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        // Token 失效，清除登录状态
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.error('登录已过期，请重新登录')
        // 跳转到登录页（避免在登录页重复跳转）
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        ElMessage.error('权限不足，无法访问该资源')
      } else {
        ElMessage.error(error.response.data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
