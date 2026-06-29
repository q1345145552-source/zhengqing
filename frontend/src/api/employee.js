import request from './request'

export function getSubmissions(filter = 'pending', pagination = {}) {
  return request.get('/employee/submissions', { params: { filter, ...pagination } })
}

export function getSubmissionDetail(id) {
  return request.get(`/employee/submissions/${id}`)
}

export function reviewSubmission(id, data) {
  return request.put(`/employee/submissions/${id}/review`, data)
}

export function nextRegister(id, data) {
  return request.put(`/employee/submissions/${id}/next-register`, data)
}

export function getReviewHistory(filter = 'all') {
  return request.get('/employee/review-history', { params: { filter } })
}

export function getTracking() {
  return request.get('/employee/tracking')
}

export function getTimeline(id) {
  return request.get(`/employee/submissions/${id}/timeline`)
}

export function getExportData(id) {
  return request.get(`/employee/submissions/${id}/export`)
}
