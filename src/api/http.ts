// src/api/http.ts
import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { showPermissionDialog } from '@/utils/permissionDialog'
// 如果用了 Pinia：import { useAuthStore } from '@/stores/auth'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

function shouldAttachToken(url?: string): boolean {
  if (!url) return false
  const path = url.startsWith('http') ? new URL(url).pathname : url
  const p = path.startsWith('/') ? path : `/${path}`
  
  if (p.startsWith('/auth')) return false
  return p.startsWith('/admin') || p.startsWith('/content')
}

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('jwt')
    if (token && shouldAttachToken(config.url)) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status = error?.response?.status

    if (status === 401 || status === 403) {
      // 用统一弹窗提示
      await showPermissionDialog('没有权限，请联系管理员')
    }
    return Promise.reject(error)
  }
)

export default request
