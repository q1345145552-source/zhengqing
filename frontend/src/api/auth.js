import request from './request'

/**
 * 登录
 * @param {string} username
 * @param {string} password
 */
export function login(username, password) {
  return request.post('/auth/login', { username, password })
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  return request.get('/auth/me')
}
