/**
 * 角色常量与工具函数
 */
export const ROLES = {
  CLIENT: 'client',
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
}

export const ROLE_LABELS = {
  client: '客户',
  employee: '员工',
  admin: '管理员',
}

export const ROLE_HOME_PAGES = {
  client: '/client/dashboard',
  employee: '/employee/dashboard',
  admin: '/admin/dashboard',
}

/**
 * 获取角色对应的首页路径
 */
export function getHomePage(role) {
  return ROLE_HOME_PAGES[role] || '/login'
}

/**
 * 获取角色对应的布局组件名称
 */
export function getLayoutName(role) {
  const map = {
    client: 'ClientLayout',
    employee: 'EmployeeLayout',
    admin: 'AdminLayout',
  }
  return map[role] || 'ClientLayout'
}
