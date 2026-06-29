import request from './request'

// ===== 客户端 =====
export function getWallet() { return request.get('/finance/client/wallet') }
export function getTransactions(page = 1) { return request.get('/finance/client/transactions', { params: { page } }) }
export function getClientCharges(submissionId) { return request.get(`/finance/client/submissions/${submissionId}/charges`) }

// ===== 员工端 =====
export function getSubmissionCharges(submissionId) { return request.get(`/finance/employee/submissions/${submissionId}/charges`) }
export function calculateCharges(submissionId, params) { return request.post(`/finance/employee/submissions/${submissionId}/calculate`, params) }
export function updateCharges(submissionId, charges) { return request.put(`/finance/employee/submissions/${submissionId}/charges`, { charges }) }
export function checkBalance(submissionId) { return request.get(`/finance/employee/submissions/${submissionId}/check-balance`) }
export function chargeSubmission(submissionId) { return request.post(`/finance/employee/submissions/${submissionId}/charge`) }
export function refundSubmission(submissionId) { return request.post(`/finance/employee/submissions/${submissionId}/refund`) }
export function markArrived(submissionId) { return request.put(`/finance/employee/submissions/${submissionId}/mark-arrived`) }
export function advanceStatus(submissionId) { return request.put(`/employee/submissions/${submissionId}/advance-status`) }

// ===== 管理员端 =====
export function getPriceRules() { return request.get('/finance/admin/price-rules') }
export function updatePriceRule(id, data) { return request.put(`/finance/admin/price-rules/${id}`, data) }
export function createPriceRule(data) { return request.post('/finance/admin/price-rules', data) }
export function deletePriceRule(id) { return request.delete(`/finance/admin/price-rules/${id}`) }
export function adminDeposit(userId, amount, description) { return request.post('/finance/admin/deposit', { user_id: userId, amount, description }) }

// ===== 充值申请 =====
export function clientDeposit(amount, description) {
  return request.post('/finance/client/deposit', { amount, description })
}
export function getClientDepositRequests(page, pageSize) {
  return request.get('/finance/client/deposit-requests', { params: { page: page || 1, pageSize: pageSize || 20 } })
}
export function getDepositRequests(filter, page, pageSize) {
  return request.get('/finance/employee/deposit-requests', { params: { filter: filter || 'pending', page: page || 1, pageSize: pageSize || 20 } })
}
export function reviewDepositRequest(id, action, comment) {
  return request.put('/finance/employee/deposit-requests/' + id, { action: action, comment: comment })
}
