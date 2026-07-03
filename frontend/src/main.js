import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import enLocale from 'element-plus/dist/locale/en.mjs'
import 'element-plus/dist/index.css'

import App from './App.vue'
import router from './router'
import i18n from './locales'
import { registerIcons } from './plugins/icons'
import './assets/styles/global.scss'

const app = createApp(App)

// 全局注册所有图标，解决 unplugin 自动导入不稳定问题
registerIcons(app)

// Element Plus locale
const elLocales = { zh: zhCn, en: enLocale, th: enLocale }
const currentLang = localStorage.getItem('lang') || 'zh'

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: elLocales[currentLang] || zhCn })

app.mount('#app')
