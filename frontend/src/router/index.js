import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getHomePage } from '@/utils/role'

// 布局组件（动态导入）
const ClientLayout = () => import('@/layouts/ClientLayout.vue')
const EmployeeLayout = () => import('@/layouts/EmployeeLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 页面组件
const Login = () => import('@/views/login/Login.vue')
const Forbidden = () => import('@/views/error/403.vue')
const NotFound = () => import('@/views/error/404.vue')
const ClientDashboard = () => import('@/views/client/Dashboard.vue')
const ClientUpload = () => import('@/views/client/upload/UploadWizard.vue')
const ClientProfile = () => import('@/views/client/profile/MyProfile.vue')
const ClientSubmissions = () => import('@/views/client/MySubmissions.vue')
const ClientWallet = () => import('@/views/client/Wallet.vue')
const ClientNotifications = () => import('@/views/client/Notifications.vue')
const ClientPriceQuery = () => import('@/views/client/PriceQuery.vue')
const ClientTracking = () => import('@/views/client/Tracking.vue')
const ClientOrders = () => import('@/views/client/Orders.vue')
const ClientOrderDetail = () => import('@/views/client/OrderDetail.vue')
const ClientTrackingDetail = () => import('@/views/client/TrackingDetail.vue')
const EmployeeDashboard = () => import('@/views/employee/Dashboard.vue')
const EmployeeReviewList = () => import('@/views/employee/review/ReviewList.vue')
const EmployeeReviewDetail = () => import('@/views/employee/review/ReviewDetail.vue')
const EmployeeReviewHistory = () => import('@/views/employee/review/ReviewHistory.vue')
const EmployeeTracking = () => import('@/views/employee/review/Tracking.vue')
const EmployeePendingCharge = () => import('@/views/employee/review/PendingCharge.vue')
const EmployeeFeeEstimate = () => import('@/views/employee/review/FeeEstimate.vue')
const EmployeeExportSummary = () => import('@/views/employee/review/ExportSummary.vue')
const EmployeeDepositReview = () => import('@/views/employee/review/DepositReview.vue')
const AdminDashboard = () => import('@/views/admin/Dashboard.vue')
const AdminSubmissionsList = () => import('@/views/admin/submissions/List.vue')
const AdminSubmissionsDetail = () => import('@/views/admin/submissions/Detail.vue')
const AdminUserList = () => import('@/views/admin/users/UserList.vue')
const AdminSettings = () => import('@/views/admin/Settings.vue')
const AdminPriceRules = () => import('@/views/admin/finance/PriceRules.vue')
const AdminTracking = () => import('@/views/admin/tracking/Tracking.vue')
const AdminEmployees = () => import('@/views/admin/employees/List.vue')
const AdminCustomers = () => import('@/views/admin/customers/List.vue')
const AdminCustomerDetail = () => import('@/views/admin/customers/Detail.vue')

/**
 * 根据角色获取对应的布局组件
 */
function getLayoutComponent(role) {
  const map = {
    client: ClientLayout,
    employee: EmployeeLayout,
    admin: AdminLayout,
  }
  return map[role] || ClientLayout
}

const routes = [
  // ==================== 公共路由 ====================
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: Forbidden,
    meta: { title: '无权限' },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面不存在' },
  },

  // ==================== 客户端路由 ====================
  {
    path: '/client',
    component: ClientLayout,
    meta: { requiresAuth: true, role: 'client' },
    children: [
      {
        path: '',
        redirect: '/client/dashboard',
      },
      {
        path: 'dashboard',
        name: 'ClientDashboard',
        component: ClientDashboard,
        meta: { title: '客户首页', icon: 'HomeFilled' },
      },
      {
        path: 'upload',
        name: 'ClientUpload',
        component: ClientUpload,
        meta: { title: '资料上传', icon: 'UploadFilled' },
      },
      {
        path: 'profile',
        name: 'ClientProfile',
        component: ClientProfile,
        meta: { title: '我的资料', icon: 'FolderOpened' },
      },
      {
        path: 'submissions',
        name: 'ClientSubmissions',
        component: ClientSubmissions,
        meta: { title: '我的申请', icon: 'Document' },
      },
      {
        path: 'wallet',
        name: 'ClientWallet',
        component: ClientWallet,
        meta: { title: '我的钱包', icon: 'Coin' },
      },
      {
        path: 'notifications',
        name: 'ClientNotifications',
        component: ClientNotifications,
        meta: { title: '消息通知', icon: 'Bell' },
      },
      {
        path: 'prices',
        name: 'ClientPriceQuery',
        component: ClientPriceQuery,
        meta: { title: '价格查询', icon: 'Money' },
      },
      {
        path: 'tracking',
        name: 'ClientTracking',
        component: ClientTracking,
        meta: { title: '货物追踪', icon: 'Ship' },
      },
      {
        path: 'tracking/:id',
        name: 'ClientTrackingDetail',
        component: ClientTrackingDetail,
        meta: { title: '订单总览', hidden: true },
      },
      {
        path: 'orders',
        name: 'ClientOrders',
        component: ClientOrders,
        meta: { title: '我的订单', icon: 'Document' },
      },
      {
        path: 'orders/:id',
        name: 'ClientOrderDetail',
        component: ClientOrderDetail,
        meta: { title: '订单详情', hidden: true },
      },
    ],
  },

  // ==================== 员工端路由 ====================
  {
    path: '/employee',
    component: EmployeeLayout,
    meta: { requiresAuth: true, role: 'employee' },
    children: [
      {
        path: '',
        redirect: '/employee/review',
      },
      {
        path: 'dashboard',
        name: 'EmployeeDashboard',
        component: EmployeeDashboard,
        meta: { title: '工作台', icon: 'Monitor' },
      },
      {
        path: 'review',
        name: 'EmployeeReviewList',
        component: EmployeeReviewList,
        meta: { title: '客户申请', icon: 'DocumentChecked' },
      },
      {
        path: 'review/:id',
        name: 'EmployeeReviewDetail',
        component: EmployeeReviewDetail,
        meta: { title: '审核详情', icon: 'DocumentChecked', hidden: true },
      },
      {
        path: 'submissions/:id/export',
        name: 'EmployeeExportSummary',
        component: EmployeeExportSummary,
        meta: { title: '资料导出汇总', hidden: true },
      },
      {
        path: 'review-history',
        name: 'EmployeeReviewHistory',
        component: EmployeeReviewHistory,
        meta: { title: '审核记录', icon: 'Notebook' },
      },
      {
        path: 'deposit-review',
        name: 'EmployeeDepositReview',
        component: EmployeeDepositReview,
        meta: { title: '充值审核', icon: 'Money' },
      },
      {
        path: 'tracking',
        name: 'EmployeeTracking',
        component: EmployeeTracking,
        meta: { title: '货物追踪', icon: 'Ship' },
      },
      {
        path: 'pending-charge',
        name: 'EmployeePendingCharge',
        component: EmployeePendingCharge,
        meta: { title: '待扣款确认', icon: 'WarningFilled' },
      },
      {
        path: 'fee-estimate',
        name: 'EmployeeFeeEstimate',
        component: EmployeeFeeEstimate,
        meta: { title: '费用预估', icon: 'Money' },
      },
    ],
  },

  // ==================== 管理员端路由 ====================
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard',
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: AdminDashboard,
        meta: { title: '管理后台首页', icon: 'Setting' },
      },
      {
        path: 'submissions',
        name: 'AdminSubmissionsList',
        component: AdminSubmissionsList,
        meta: { title: '所有申请', icon: 'List' },
      },
      {
        path: 'submissions/:id',
        name: 'AdminSubmissionsDetail',
        component: AdminSubmissionsDetail,
        meta: { title: '申请详情', icon: 'List', hidden: true },
      },
      {
        path: 'users',
        name: 'AdminUserList',
        component: AdminUserList,
        meta: { title: '用户管理', icon: 'UserFilled' },
      },
      {
        path: 'employees',
        name: 'AdminEmployees',
        component: AdminEmployees,
        meta: { title: '员工管理', icon: 'User' },
      },
      {
        path: 'customers',
        name: 'AdminCustomers',
        component: AdminCustomers,
        meta: { title: '客户管理', icon: 'UserFilled' },
      },
      {
        path: 'customers/:id',
        name: 'AdminCustomerDetail',
        component: AdminCustomerDetail,
        meta: { title: '客户详情', hidden: true },
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: AdminSettings,
        meta: { title: '系统配置', icon: 'Tools' },
      },
      {
        path: 'tracking',
        name: 'AdminTracking',
        component: AdminTracking,
        meta: { title: '货物追踪', icon: 'Ship' },
      },
      {
        path: 'finance/price-rules',
        name: 'AdminPriceRules',
        component: AdminPriceRules,
        meta: { title: '价格规则', icon: 'Money' },
      },
    ],
  },

  // ==================== 根路径 ====================
  {
    path: '/',
    redirect: '/login',
  },

  // ==================== 兜底 404 ====================
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ==================== 路由守卫 ====================
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 湘泰正清系统` : '正清系统'

  const authStore = useAuthStore()

  // 不需要认证的页面，直接放行
  if (to.meta.requiresAuth === false) {
    // 如果已登录用户访问登录页，自动跳转到对应首页
    if (to.path === '/login' && authStore.isLoggedIn) {
      return next(authStore.homePage)
    }
    return next()
  }

  // 需要认证的页面
  if (!authStore.isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // 如果 store 中没有用户信息，尝试从服务端恢复
  if (!authStore.user) {
    const user = await authStore.fetchUser()
    if (!user) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }

  // 检查角色权限
  const routeRole = to.meta.role
  if (routeRole && authStore.role !== routeRole) {
    return next('/403')
  }

  next()
})

export default router
