import { defineStore } from 'pinia'
import { login as loginApi, getCurrentUser } from '@/api/auth'
import { getHomePage } from '@/utils/role'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    role: (state) => state.user?.role || '',
    isClient: (state) => state.user?.role === 'client',
    isEmployee: (state) => state.user?.role === 'employee',
    isAdmin: (state) => state.user?.role === 'admin',
    username: (state) => state.user?.username || '',
    homePage: (state) => getHomePage(state.user?.role),
  },

  actions: {
    /**
     * 登录
     */
    async login(username, password) {
      const res = await loginApi(username, password)
      const { token, user } = res.data
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      return user
    },

    /**
     * 获取当前用户信息（刷新页面时恢复状态）
     */
    async fetchUser() {
      if (!this.token) return null
      try {
        const res = await getCurrentUser()
        this.user = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
        return res.data
      } catch {
        this.logout()
        return null
      }
    },

    /**
     * 退出登录
     */
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
  },
})
