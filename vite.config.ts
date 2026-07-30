import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'lifeflow',
        short_name: 'lifeflow',
        description: '个人健康、任务、财务与时间管理',
        theme_color: '#101915',
        background_color: '#edf1ef',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: { navigateFallback: '/index.html' }
    })
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: true, port: 5173, strictPort: false, proxy: { '/api': 'http://localhost:8080' } },
  build: {
    outDir: 'lifeflow',
    assetsDir: 'assets',
    target: 'es2020',
    sourcemap: false,
    emptyOutDir: true
  }
})
