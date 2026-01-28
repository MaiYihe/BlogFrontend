import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env.* 配置文件到对象
  const env = loadEnv(mode, process.cwd(), '')

  return {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',  // 不使用哈希
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        }
      }
    },
    plugins: [vue()],
    base: env.VITE_PUBLIC_BASE || '/',  // 设置基础路径
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
