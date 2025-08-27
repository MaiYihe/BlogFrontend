<template>
  <div class="auth-wrap">
    <!-- 左上角返回按钮 -->
    <!-- 左上角返回按钮 -->
    <button class="back-btn" @click="goBack">
      <img :src="goBackIcon" alt="返回" class="back-icon" />
    </button>

    <div class="card">
      <h1 class="title">
        Welcome <span class="accent">Back</span>
      </h1>
      <p class="subtitle">使用账号登录，继续探索与记录。</p>

      <form @submit.prevent="onSubmit" class="form">
        <div class="field">
          <label>Account (Email)</label>
          <input
            v-model.trim="username"
            type="text"
            placeholder="@example.com"
            autocomplete="username"
          />
        </div>

        <div class="field">
          <label>Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div class="row">
          <label class="checkbox">
            <input type="checkbox" v-model="remember" />
            <span>Remember me</span>
          </label>

          <button type="button" class="link" @click="onForgot">Forgot password?</button>
        </div>

        <p v-if="err" class="error">{{ err }}</p>

        <button type="submit" class="btn-primary" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else>Logging in…</span>
        </button>

        <p class="hint">访客模式：用户名和密码都是 <code class="guest-hint">guest</code></p>

        <div class="divider"><span>or</span></div>

        <button type="button" class="btn-ghost" @click="toRegister">
          Create a new account
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import goBackIcon from '@/assets/icons/goBack.svg'
import { useAuthStore } from '@/stores/auth'
import { doLogin } from '@/utils/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()

// 返回按钮逻辑
function goBack () {
  if (history.length > 1) {
    window.history.back()
  } else {
    // 如果没有历史，退回首页或指定页面
    window.location.href = '/'
  }
}

// 表单数据
const username = ref('')
const password = ref('')
const remember = ref(true)
const loading  = ref(false)
const err      = ref('')


function onForgot () {
  alert('没有权限，请联系管理员')
}

function toRegister () {
  alert('没有权限，请联系管理员')
}

// 登录（表单提交统一入口：支持点击和回车）
const onSubmit = async () => {
  if (loading.value) return
  err.value = ''

  const u = username.value.trim()
  const p = password.value

  // ① guest 分支：不打 API，直接本地通过
  if (u === 'guest' && p === 'guest') {
    auth.loginGuest()                // isAuthed=true, mode='guest'
    if (remember.value) localStorage.setItem('username', u)
    router.push('/')                 // 跳转主页
    return
  }

  // ② JWT 分支：调后端，成功后存 token
  loading.value = true
  try {
    const data = await doLogin({ username: u, password: p })  // 约定返回 { token, ... }
    auth.loginWithJwt(data.token, u)                          // isAuthed=true, mode='jwt'
    if (remember.value) localStorage.setItem('username', u)
    router.push('/')
  } catch (e: any) {
    err.value = e.message || '登录失败'
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.back-btn {
  position: absolute;
  top: 1.2rem;
  left: 1.4rem;
  background: none;
  border: none;
  color: #d9a669; /* 跟 accent 色系一致 */
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color .2s;
}
.back-btn:hover {
  color: #f0c98d;
}
.back-icon {
  width: 50px;   /* 放大 */
  height: 50px;
}


/* ======= 调色板（与你首页风格一致） ======= */
.auth-wrap{
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 6vh 2rem;
  background-color: #2b2b2b; /* 外层更深，拉开层次 */
  /* 轻微的斜向刷痕与柔光，保持统一风格 */
  background-image:
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px),
    linear-gradient(-45deg, rgba(255,255,255,0.05), rgba(0,0,0,0.25));
  background-blend-mode: soft-light;
}

.card{
  width: min(680px, 92vw);
  background: #3a3a3a;               /* 卡片比背景更亮 */
  color: #e6edf3;
  border-radius: 18px;
  padding: 2.2rem clamp(1.2rem, 3vw, 2.6rem);
  box-shadow:
    0 20px 40px rgba(0,0,0,.45),
    0 2px 0 rgba(255,255,255,.04) inset;
  border: 1px solid rgba(255,255,255,.06);
}

/* 标题与强调色：暖金色系 */
.title{
  font-size: clamp(26px, 4.2vw, 42px);
  font-weight: 800;
  letter-spacing: .3px;
  margin: .4rem 0 0;
  text-align: center;
}
.accent{
  background: linear-gradient(180deg,#d9a669 0%, #b8833d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 12px rgba(185,132,61,.18);
}
.subtitle{
  text-align: center;
  color: #b9c1c8;
  margin: .6rem 0 1.6rem;
}

/* 表单 */
.form{ margin-top: .25rem; }
.field{ margin-bottom: 1rem; }
.field label{
  display: block;
  font-size: .95rem;
  color: #cfd6dc;
  margin-bottom: .4rem;
}
.field input{
  width: 100%;
  height: 44px;
  padding: 0 .9rem;
  border-radius: 10px;
  color: #e6edf3;
  background: #2f2f2f;
  border: 1px solid rgba(255,255,255,.08);
  outline: none;
  transition: border-color .2s, box-shadow .2s, background .2s;
}
.field input::placeholder{ color: #97a3ad; }
.field input:focus{
  border-color: rgba(217,166,105,.7);
  box-shadow: 0 0 0 3px rgba(217,166,105,.18);
  background: #343434;
}

.row{
  margin-top: .2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .6rem;
}
.checkbox{
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  color: #cfd6dc;
  user-select: none;
}
.checkbox input{
  width: 16px; height: 16px;
  accent-color: #d9a669; /* 兼容现代浏览器的勾选色 */
}
.link{
  color: #d9a669;
  background: none; border: 0; padding: 0;
  cursor: pointer;
}
.link:hover{ text-decoration: underline; }

/* 错误提示 */
.error{
  color: #ffb4b4;
  margin: .6rem 0 -.2rem;
}

/* 按钮 */
.btn-primary{
  width: 100%;
  height: 46px;
  margin-top: 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.08);
  color: #2b241a;
  font-weight: 700;
  letter-spacing: .2px;
  background: linear-gradient(180deg,#d9a669 0%, #b8833d 100%);
  box-shadow:
    0 12px 28px rgba(185,132,61,.28),
    0 1px 0 rgba(255,255,255,.12) inset;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease, box-shadow .2s ease;
}
.btn-primary:hover{ filter: brightness(1.03); }
.btn-primary:active{ transform: translateY(1px); }
.btn-primary:disabled{
  opacity: .7;
  cursor: not-allowed;
  filter: grayscale(.2);
}

.btn-ghost{
  width: 100%;
  height: 42px;
  margin-top: .8rem;
  border-radius: 10px;
  border: 1px dashed rgba(217,166,105,.5);
  color: #e6edf3;
  background: transparent;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}
.btn-ghost:hover{
  background: rgba(217,166,105,.08);
  border-color: rgba(217,166,105,.8);
}

/* 分割线 */
.divider{
  display: flex; align-items: center;
  gap: .8rem;
  margin: 1rem 0 .3rem;
  color: #9aa6af;
}
.divider::before,
.divider::after{
  content: "";
  flex: 1 1 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
}
.divider span{ opacity: .9; }

.hint {
  margin-top: 12px;
  font-size: 0.85rem;
  color: #aaa; /* 或者用你主题里的次级文字色 */
  text-align: center;
}

.guest-hint {
  color: #d9a669;
}

</style>
