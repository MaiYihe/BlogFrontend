<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">

    <div class="container-fluid">

      <div class="navbar-left">
        <!-- 导航栏左侧文字 -->
        <router-link class="navbar-brand" to="/">MAIYIHE BLOG</router-link>

        <!-- 控制侧边栏的按钮 -->
        <!-- 当用户点击按钮时，当前组件（比如 HeaderNavbar.vue）主动向它的“父组件”触发一个名为 'toggle-sidebar' 的自定义事件 -->

        <button class="btn sidebar-toggle" @click="emit('toggle-sidebar')">☰</button>
      </div>

      <!-- 折叠按钮（移动端） -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
        aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- 折叠内容 -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/">Home</router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/projects">Projects</router-link>
          </li>

          <li class="nav-item">
            <a href="#" class="nav-link" @click.prevent="showContact = true">Contact</a>
          </li>

          <!-- 未登录：显示 Login -->
          <li class="nav-item" v-if="!isLogined">
            <router-link class="nav-link" to="/login">Login</router-link>
          </li>

          <li class="nav-item dropdown" v-else>
            <!-- 用 button/anchor + dropdown，不用 router-link -->
            <a href="#" class="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false"
              @click.prevent>
              Account
            </a>
            <ul class="dropdown-menu dropdown-menu-end account-menu">
              <li>
                <span class="dropdown-item-text" style="color: #e6edf3;">
                  Role: {{ isAuthed ? 'Admin' : 'Guest' }}
                </span>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <button class="dropdown-item" @click="goEditCategory">
                  Edit Category
                </button>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>

              <li>
                <el-tooltip v-if="!isAuthed" content="访客没有权限，请联系管理员" placement="left" effect="dark">
                  <button class="dropdown-item disabled-item">
                    ContentScan
                  </button>
                </el-tooltip>
                <button v-else class="dropdown-item" @click="goContentScan">
                  ContentScan
                </button>
              </li>

              <li>
                <hr class="dropdown-divider">
              </li>

              <li>
                <el-tooltip v-if="!isAuthed" content="访客没有权限，请联系管理员" placement="left" effect="dark">
                  <button class="dropdown-item disabled-item">
                    FiguresScan
                  </button>
                </el-tooltip>
                <button v-else class="dropdown-item" @click="goFiguresScan">
                  FiguresScan
                </button>
              </li>

              <li>
                <hr class="dropdown-divider">
              </li>
              <li>

                <button class="dropdown-item text-danger" @click="handleLogout">
                  Logout
                </button>
              </li>
            </ul>
          </li>

        </ul>
      </div>
    </div>
  </nav>

  <!-- 🚀 扫描结果弹窗 -->
  <el-dialog v-model="showScanDialog" title="扫描结果" width="420px" :show-close="false" modal modal-class="dim-mask"
    append-to-body>
    <div>{{ contentScanResult }}</div>

    <template #footer>
      <el-button type="primary" @click="showScanDialog = false">确定</el-button>
    </template>
  </el-dialog>

  <!-- 用 teleport 把弹窗渲染到 body，避免被父层样式/overflow 影响 -->
  <ContactCard v-model="showContact" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import ContactCard from '../components/ContactCard.vue'
import { useRouter } from 'vue-router'
import { contentScan } from '@/api/admin/contentApi'
import { scanFiguresToOSS } from '@/api/admin/ossApi'
import { useAuthStore } from '@/stores/auth'
import { doLogout } from '@/utils/auth'

const router = useRouter()
const auth = useAuthStore()

// 只要 store 里状态初始化过，就是“已登录”
const isLogined = computed(() => auth.isAuthed) // guest 或 jwt 都算
const isAuthed = computed(() => auth.mode === 'jwt') // 仅 jwt 算 Admin


// 声明自定义事件
const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()

const showContact = ref(false)
const close = () => { showContact.value = false }
const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
onMounted(() => window.addEventListener('keydown', onEsc))
onBeforeUnmount(() => window.removeEventListener('keydown', onEsc))


function goEditCategory() {
  router.push('/EditCategory')
}


const contentScanResult = ref('')
const showScanDialog = ref(false)

async function goContentScan() {
  try {
    const res = await contentScan()
    contentScanResult.value = res.data
  } catch (err) {
    console.error('扫描失败：', err)
    contentScanResult.value = '扫描失败，请稍后重试'
  } finally {
    // ✅ 无论成功失败，都弹窗显示结果
    showScanDialog.value = true
  }
}

async function goFiguresScan() {
  try {
    const res = await scanFiguresToOSS()
    contentScanResult.value = res.data
  } catch (err) {
    console.error('扫描失败：', err)
    contentScanResult.value = '扫描失败，请稍后重试'
  } finally {
    // ✅ 无论成功失败，都弹窗显示结果
    showScanDialog.value = true
  }
}




/** 模拟“已登录”来预览效果；接入真实登录后替换这里 */
const loading = ref(false)
const message = ref('')
const handleLogout = async () => {
  if (loading.value) return
  loading.value = true
  try {
    if (auth.mode === 'jwt') {
      // 仅在 jwt 情况下礼貌通知后端，失败忽略
      try { await doLogout() } catch { }
    }
    // 本地清理 + 设为未登录
    auth.logoutToUnauthed()
    message.value = '登出成功'
    // 可选：跳转登录页
    // router.push('/login')
  } catch (e: any) {
    message.value = e.message || '登出失败'
  } finally {
    loading.value = false
  }
}
</script>
<!-- 样式只作用于当前组件 -->
<style scoped>
/* ===导航栏整体 */
.navbar {
  top: 0;
  left: 0;
  right: 0;
}

/* ===导航栏左侧字体 */
.navbar-brand {
  font-size: 1.8rem;
  /* 控制字体大小 */
  font-weight: bold;
  /* 控制加粗 */
  font-family: "Segoe UI", sans-serif;
  /* 可选：修改字体 */
}


.navbar-left {
  display: flex;
  align-items: center;
  /* 竖直居中 */
  gap: 8px;
  /* 文字和按钮之间的间距 */
}

/* ===导航栏右侧图标 */
.sidebar-toggle {
  background-color: transparent;
  color: white;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 1.2rem;
  border-radius: 0.5rem;
  transition: background-color 0.4s ease-out;
}

.sidebar-toggle:hover {
  color: black;
  /* 悬停时字体反色 */
  background-color: white;
  /* 悬停时背景反色 */
}

.navbar-nav .nav-link {
  padding-top: 0.8rem;
  /* 往下偏移 */
}


/* 登陆后的 Account 弹窗 */
/* 黑色背景的下拉菜单 */
.account-menu {
  min-width: 180px;
  padding: .5rem 0;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, .08);
  background-color: #2b2b2b;
  /* 深色背景 */
  box-shadow: 0 10px 24px rgba(0, 0, 0, .5);
}

/* 每一项样式 */
.account-menu .dropdown-item {
  color: #e6edf3;
  /* 文字浅色 */
  border-radius: 8px;
  padding: .6rem 1rem;
  font-size: 0.95rem;
  transition: background .2s;
}

.account-menu .dropdown-item:hover {
  background-color: rgba(255, 255, 255, .08);
  /* hover 时轻微亮起 */
}

/* 分割线也调暗 */
.account-menu .dropdown-divider {
  border-color: rgba(255, 255, 255, .15);
}

/* logout 按钮特别标红 */
.account-menu .dropdown-item.text-danger {
  color: #ff6b6b !important;
}

.account-menu .dropdown-item.text-danger:hover {
  background-color: rgba(255, 0, 0, .1);
}

.disabled-item {
  color: #6c757d !important;
  /* 灰色文字 */
  cursor: not-allowed !important;
  /* 禁止符号 */
  background-color: transparent !important;
  /* 悬停时不变色 */
}
</style>