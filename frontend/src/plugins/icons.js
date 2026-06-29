/**
 * 全局注册 Element Plus 图标
 * 一次性注册所有系统使用的图标，解决 unplugin 自动导入不稳定导致空白页的问题
 */
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const icons = [
  // 导航和页面
  'HomeFilled', 'Monitor', 'Setting', 'Tools', 'Menu',
  'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Right',
  // 数据和文件
  'Document', 'DocumentChecked', 'DocumentCopy', 'FolderOpened',
  'Upload', 'UploadFilled', 'Download',
  // 用户
  'User', 'UserFilled', 'Avatar',
  // 通知和状态
  'Bell', 'WarningFilled', 'InfoFilled', 'CircleCheckFilled', 'CircleCloseFilled',
  'Clock', 'Timer', 'Loading',
  // 操作
  'Search', 'Edit', 'Delete', 'Plus', 'Close', 'Check', 'View',
  // 业务
  'Ship', 'Money', 'Coin', 'Wallet', 'CreditCard', 'Link',
  'Lock', 'Unlock', 'Key',
  'Connection', 'Link',
  'OfficeBuilding', 'Office', 'Goods',
  'Tickets', 'Stamp',
  'List', 'DataAnalysis', 'Notebook', 'Collection',
  // 地图
  'MapLocation', 'Location', 'Phone',
  // 展开收起
  'Expand', 'Fold',
]

export function registerIcons(app) {
  icons.forEach(name => {
    const component = ElementPlusIconsVue[name]
    if (component) {
      app.component(name, component)
    }
  })
}
