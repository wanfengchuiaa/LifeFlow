import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({
    plugins: [
        vue(),
        VitePWA({
            registerType: 'prompt',
            includeAssets: ['icon.svg'],
            manifest: {
                name: 'LifeFlow',
                short_name: 'LifeFlow',
                description: '个人健康、任务、财务与时间管理',
                theme_color: '#1e9b68',
                background_color: '#f5f7f6',
                display: 'standalone',
                start_url: '/',
                icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
            },
            workbox: { navigateFallback: '/index.html' }
        })
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } }
});
