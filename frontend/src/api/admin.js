import request from './request'

export function getAllSubmissions(filter = 'all', pagination = {}) {
  return request.get('/admin/submissions', { params: { filter, ...pagination } })
}

export function getSubmissionDetail(id) {
  return request.get(`/admin/submissions/${id}`)
}
