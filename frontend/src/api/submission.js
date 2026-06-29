import request from './request'

/**
 * 创建新的提交流程
 */
export function createSubmission() {
  return request.post('/submissions')
}

/**
 * 获取当前用户进行中的提交
 */
export function getCurrentSubmission() {
  return request.get('/submissions/current')
}

/**
 * 获取提交详情
 */
export function getSubmission(id) {
  return request.get(`/submissions/${id}`)
}

/**
 * 保存指定步骤数据
 * @param {number} id - submission id
 * @param {number} step - 步骤编号 1-5
 * @param {object} data - 步骤数据
 */
export function saveStep(id, step, data) {
  return request.put(`/submissions/${id}/step/${step}`, data)
}

/**
 * 上传文件
 * @param {number} id - submission id
 * @param {number} stage - 所属阶段
 * @param {File} file - 文件对象
 */
export function uploadFile(id, stage, file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('stage', stage)
  return request.post(`/submissions/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 最终提交
 */
export function submitSubmission(id) {
  return request.post(`/submissions/${id}/submit`)
}

/**
 * 获取我的提交列表（含审核状态）
 */
export function getMySubmissions() {
  return request.get('/submissions')
}

/**
 * 退回后重新提交
 */
export function resubmitSubmission(id) {
  return request.put(`/submissions/${id}/resubmit`)
}
