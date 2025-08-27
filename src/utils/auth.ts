// src/utils/authUtil.ts
import { loginUser, logoutUser, type LoginPayload } from '@/api/authApi'


export async function doLogin(payload: LoginPayload) {
  try {
    const res = await loginUser(payload)
    return res.data
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '登录失败')
  }
}


export async function doLogout() {
  try {
    const res = await logoutUser()
    // 清理本地缓存
    localStorage.removeItem('token')
    return res.data
  } catch (err: any) {
    throw new Error(err.response?.data?.message || err.message || '登出失败')
  }
}