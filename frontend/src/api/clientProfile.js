import request from './request'

/**
 * 上传文件（资料模块专用）
 */
export function uploadProfileFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/client/upload', formData)
}

// ===== 公司资料 =====
export function getCompanyDocs() {
  return request.get('/client/company-docs')
}

export function createCompanyDoc(data) {
  return request.post('/client/company-docs', data)
}

export function updateCompanyDoc(id, data) {
  return request.put(`/client/company-docs/${id}`, data)
}

export function deleteCompanyDoc(id) {
  return request.delete(`/client/company-docs/${id}`)
}

// ===== 报关授权 =====
export function getCustomsAuths() {
  return request.get('/client/customs-auths')
}

export function createCustomsAuth(data) {
  return request.post('/client/customs-auths', data)
}

export function updateCustomsAuth(id, data) {
  return request.put(`/client/customs-auths/${id}`, data)
}

export function deleteCustomsAuth(id) {
  return request.delete(`/client/customs-auths/${id}`)
}
