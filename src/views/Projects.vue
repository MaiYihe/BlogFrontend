<template>
  <div class="projects-page">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="goBack">
      <img :src="goBackIcon" alt="返回" class="back-icon" />
    </button>

    <!-- 页标题 -->
    <header class="page-header">
      <h1 class="page-title">
        <span class="accent">我的</span>开源项目
      </h1>
      <p class="subtitle">Past Open-Source Works</p>
    </header>

    <!-- 分类展示 -->
    <section v-for="(list, category) in projects" :key="category" class="category-block">
      <h2 class="category-title">{{ category }}</h2>
      <ul class="project-list">
        <li v-for="p in list" :key="p.name" class="project-item">
          <h3 class="project-name">
            <a :href="p.link" target="_blank" rel="noopener">{{ p.name }}</a>
          </h3>
          <p class="project-desc">{{ p.desc }}</p>
        </li>
      </ul>
    </section>

        <!-- 底部更新时间 -->
    <footer class="update-time">
      更新时间：{{ updateTime }}
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import goBackIcon from '@/assets/icons/goBack.svg'
// 返回按钮逻辑
function goBack () {
  if (history.length > 1) {
    window.history.back()
  } else {
    // 如果没有历史，退回首页或指定页面
    window.location.href = '/'
  }
}

interface Project {
  name: string
  desc: string
  link: string
}
const projects = ref<Record<string, Project[]>>({})
const updateTime = ref<string>('')


function formatTime(d: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit'
  }).format(d)
}

onMounted(async () => {
  try {
    // 统一从 public 根读取；带时间戳避免缓存
    const url = `/projectsConfig.json?ts=${Date.now()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    projects.value = (data.projects && typeof data.projects === 'object') ? data.projects : data

    // 优先用响应头的 Last-Modified；没有就看 data.updatedAt；再没有用当前时间兜底
    const lm = res.headers.get('last-modified')
    if (lm) {
      updateTime.value = formatTime(new Date(lm))
    } else if (data.updatedAt) {
      updateTime.value = formatTime(new Date(data.updatedAt))
    } else {
      updateTime.value = formatTime(new Date())
    }
  } catch (err) {
    console.error('加载 projectsConfig.json 失败：', err)
    updateTime.value = '—'
    projects.value = {} // 保持为空，模板会渲染个空列表
  }
})

</script>

<style scoped>
.projects-page {
  height: 100vh;            /* ✅ 固定视口高度，统一由该容器滚动 */
  padding: 6vh 2.5rem;
  background-color: #333333;
  background-image:
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 8px),
    linear-gradient(-45deg, rgba(255,255,255,0.05), rgba(0,0,0,0.25));
  background-blend-mode: soft-light;
  color: #e6edf3;
  position: relative;

  overflow-y: auto;         /* ✅ 只上下滚 */
  overflow-x: hidden;       /* ✅ 禁止左右滚 */
}

/* ✅ Chrome / Edge / Safari 滚轮样式 */
.projects-page::-webkit-scrollbar {
  width: 8px;          /* 纵向滚轮宽度 */
  height: 0px;         /* 横向滚轮彻底隐藏 */
}
.projects-page::-webkit-scrollbar-track {
  background: transparent;  /* 与页面背景融合 */
}
.projects-page::-webkit-scrollbar-thumb {
  background: rgba(160,160,160,.6);  /* 灰色半透明 */
  border-radius: 4px;
}
.projects-page::-webkit-scrollbar-thumb:hover {
  background: rgba(160,160,160,.9);  /* hover 稍亮 */
}

/* ✅ 防止子元素撑破导致横向滚动条出现 */
.project-item {
  max-width: 100%;
  overflow-wrap: break-word;
}



/* 返回按钮：与 Login.vue 金色系统一 */
.back-btn {
  position: absolute;
  top: 1.4rem;
  left: 1.6rem;
  background: none;
  border: none;
  color: #d9a669;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color .2s;
}
.back-btn:hover { color: #f0c98d; }
.back-icon {
  width: 50px;
  height: 50px;
}


/* 标题：accent 金色，风格和 Login.vue 相呼应 */
.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.page-title {
  font-size: clamp(32px, 5vw, 50px);
  font-weight: 800;
  margin: 0;
  letter-spacing: .5px;
}
.page-title .accent {
  background: linear-gradient(180deg,#d9a669 0%, #b8833d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 14px rgba(185,132,61,.22);
}
.subtitle {
  margin-top: .6rem;
  font-size: 1rem;
  color: #b9c1c8;
}

/* 分类标题：用金色系 */
.category-block {
  margin-bottom: 2.2rem;
}
.category-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #d9a669;
}

/* 项目列表：保持暗色卡片风 */
.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.project-item {
  margin-bottom: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 12px;
  transition: transform .2s ease, box-shadow .2s ease;
}
.project-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,.35);
  border-color: rgba(217,166,105,.35); /* hover 边框带点金色 */
}
.project-name {
  margin: 0;
  font-size: 1.05rem;
}
.project-name a {
  color: #8ab4f8;
  text-decoration: none;
}
.project-name a:hover { text-decoration: underline; }
.project-desc {
  margin: .4rem 0 0;
  font-size: .92rem;
  color: #cfd6dc;
}

/* 底部更新时间 */
.update-time {
  margin-top: 3rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(255,255,255,.08);
  font-size: 0.9rem;
  color: #9aa6af;         /* 温和的灰色 */
  text-align: center;
  font-style: italic;     /* 斜体更精致 */
}
</style>

