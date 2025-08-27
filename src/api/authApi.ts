// src/api/auth.js
import request from '@/api/http'  // 之前创建的 axios 实例
import type { AxiosResponse } from 'axios'

// 登录参数类型（示例）
export interface LoginPayload {
  username: string
  password: string
}

// 注册
export function registerUser(data: LoginPayload): Promise<AxiosResponse<any>> {
  return request.post('/auth/register', data)
}

// 登录
export function loginUser(data: LoginPayload): Promise<AxiosResponse<any>> {
  return request.post('/auth/login', data)
}

// 登出（无参数）
export function logoutUser(): Promise<AxiosResponse<any>> {
  return request.post('/auth/logout')
}