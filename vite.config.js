import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') // 读取 .env.* 到对象

  return {
    plugins: [vue()],
    base: env.VITE_PUBLIC_BASE || '/',
    server: {
      proxy: {
        '/api': { target: 'http://127.0.0.1:8080', changeOrigin: true }
      }
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
  }
})