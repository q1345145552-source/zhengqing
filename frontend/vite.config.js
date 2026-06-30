import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['all'],
  },
  build: {
    // 目标浏览器（减少 polyfill 体积）
    target: 'es2020',
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 资源内联阈值（小于 4KB 的资源内联为 base64）
    assetsInlineLimit: 4096,
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 手动分包：将大型第三方依赖拆分为独立 chunk
        manualChunks: {
          // Vue 全家桶
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          // Element Plus UI 库（通常最大，单独拆）
          'vendor-element': ['element-plus', '@element-plus/icons-vue'],
          // 国际化
          'vendor-i18n': ['vue-i18n'],
          // HTTP 请求
          'vendor-axios': ['axios'],
        },
        // 统一 chunk 文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 压缩：使用 esbuild（Vite 内置，无需额外安装，速度更快）
    minify: 'esbuild',
    // esbuild 配置：移除 console 和 debugger（生产环境）
    esbuild: {
      drop: ['console', 'debugger'],
    },
  },
})
