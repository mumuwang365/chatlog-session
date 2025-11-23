import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import App from './App.vue'
import router from './router'
import './assets/styles/index.scss'
import { db } from './utils/db'
import { initServiceWorker } from './utils/serviceWorker'

// 开发环境：导入缓存调试工具
if (import.meta.env.DEV) {
  import('./utils/debugCache').then(module => {
    module.installDebugTools()
  })
}

const app = createApp(App)

// 注册 Pinia
app.use(createPinia())

// 注册 Router
app.use(router)

// 注册 Element Plus
app.use(ElementPlus)

// 注册虚拟滚动
app.use(VueVirtualScroller)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化 IndexedDB
db.init().catch(err => {
  console.error('❌ IndexedDB 初始化失败:', err)
})

// 挂载应用
app.mount('#app')

// 初始化 Service Worker（生产环境）
if (import.meta.env.PROD) {
  initServiceWorker({
    enabled: true,
    scriptUrl: '/sw.js',
    scope: '/',
  }).then((manager) => {
    console.log('✅ Service Worker initialized')
    
    // 监听更新
    manager.on('updateready', () => {
      console.log('🔄 New version available')
      // 可以在这里提示用户刷新页面
      if (confirm('发现新版本！是否立即更新？')) {
        manager.skipWaiting().then(() => {
          window.location.reload()
        })
      }
    })
    
    // 监听错误
    manager.on('error', (error) => {
      console.error('❌ Service Worker error:', error)
    })
  }).catch((error) => {
    console.error('❌ Failed to initialize Service Worker:', error)
  })
}

// 注意：已移除自动后台刷新联系人功能
// 用户可以在 Contact 视图中手动触发刷新

// 开发环境日志
if (import.meta.env.DEV) {
  console.log('🚀 Chatlog Session v' + import.meta.env.VITE_APP_VERSION)
  console.log('📡 API Base URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('🔧 Debug Mode:', import.meta.env.VITE_ENABLE_DEBUG)
}

// 页面卸载时关闭数据库
window.addEventListener('beforeunload', () => {
  db.close()
})