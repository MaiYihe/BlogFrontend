// src/stores/auth.ts
import { defineStore } from 'pinia'
import request from '@/api/http'

type AuthMode = 'guest' | 'jwt' | null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthed: false,          // 未登录=false；guest/jwt=true
    mode: null as AuthMode,   // null=未登录, guest=游客, jwt=实名
    token: '' as string,
    username: '' as string,
  }),
  getters: {
    isLogined: (s) => s.isAuthed,           // 业务里通用判断：是否已登录（guest/jwt）
    isAdmin:   (s) => s.mode === 'jwt',     // 需要严格 JWT 的地方用这个
  },
  actions: {
    async initAuth() {
      const jwt = localStorage.getItem('jwt')
      if (jwt) {
        try {
          const res = await request.get('/auth/validate', {
            headers: { Authorization: `Bearer ${jwt}` }
          })
          this.isAuthed = true
          this.mode = 'jwt'
          this.token = jwt
          this.username = res.data.username ?? 'user'
          return
        } catch {
          localStorage.removeItem('jwt')
        }
      }
      // 刷新后变 guest 也OK的话，就保留这段；如果不想自动guest，改成保持未登录
      this.isAuthed = true        // ← 想刷新后直接guest就 true
      this.mode = 'guest'         // ← 想刷新后保持未登录就改成：this.isAuthed=false; this.mode=null
      this.token = ''
      this.username = 'guest'
    },
    loginWithJwt(token: string, username: string) {
      this.isAuthed = true
      this.mode = 'jwt'
      this.token = token
      this.username = username
      localStorage.setItem('jwt', token)
    },
    loginGuest(username = 'guest') {
      this.isAuthed = true
      this.mode = 'guest'
      this.token = ''
      this.username = username
      localStorage.removeItem('jwt')
    },
    // 登出后设为“未登录”
    logoutToUnauthed() {
      this.isAuthed = false
      this.mode = null
      this.token = ''
      this.username = ''
      localStorage.removeItem('jwt')
    },
  },
})