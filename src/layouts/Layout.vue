<template>
  <div :class="route.path === '/' ? 'layoutHome' : 'layout'">
    <!-- 顶部导航栏 -->
    <!-- toggleSidebar 是按钮绑定的事件，控制 showSidebar 的值 -->
    <HeaderNavbar @toggle-sidebar="toggleSidebar" />

    <div class="row" ref="rowRef" :class="{ collapsed: !showSidebar, dragging: isDragging }"
      :style="{ '--a': sidebarWidth + 'px', '--gap': '0px', '--topbar-h': '48px' }">
      <!-- A：侧边栏外层仅负责“占位宽度 + 裁切” -->
      <div class="A sidebar" @transitionend="onATransitionEnd">
        <!-- A 内部真正滑走的内容：就是你的 Sidebar 组件 -->
        <Sidebar v-model:isMarkingA="isMarkingA" />
        <!-- 拖动条子组件 -->
        <SideBarResizer class="resizer" @drag-start="isDragging = true" @drag-end="isDragging = false"
          @resizing="onResizing" />
      </div>

      <!-- 开启蒙版时候的圆形按钮 -->
      <div v-if="isMarkingA" class="close-btn-wrap">
        <CloseCircleButton v-model="isMarkingA" @close="toggleSidebar" />
      </div>


      <!-- B：主内容区域 -->
      <main class="B" ref="box" @scroll="onScroll">
        <div class="X" ref="contentRef">
          <!-- 路由占位符。Vue Router 会根据当前 URL 匹配到的路由组件，自动在 <router-view> 这个位置渲染出来 -->
          <router-view/>
        </div>

        <!-- B区域页面右下角的圆形按钮 -->
        <!-- 🚫 只有不在根目录时才显示,仅当需要滚动时显示 -->
        <LocateToTop v-if="route.path !== '/' && needsScroll" class="locate-btn" :at-bottom="isAtBottom"
          @click="toTop" />

        <ViewCount v-if="route.path !== '/'" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'

import SideBarResizer from '../components/SideBarResizer.vue'
import Sidebar from '../components/SideBar.vue'
import HeaderNavbar from '../components/HeaderNavbar.vue'
import LocateToTop from '../components/LocateToTop.vue'
import ViewCount from '../components/ViewCount.vue'
import CloseCircleButton from '@/components/CloseCircleButton.vue'
import { useSidebarTreeStore } from '@/stores/sideBarTree'
import { fetchNoteTree } from '@/api/treeNodeApi'

const route = useRoute()

const isMarkingA = ref(false)
const showCloseBtn = ref(false)     // UI状态：是否渲染按钮

/** 侧边栏显隐 */
const showSidebar = ref(true)
const toggleSidebar = () => { showSidebar.value = !showSidebar.value }

/** 提升文件夹展开状态到父 */
// const expandedMap = reactive<Record<string, boolean>>({})

/** 侧栏宽度（驱动 --a） */
const sidebarWidth = ref(300)
const rowRef = ref<HTMLElement | null>(null)
const MIN_W = 300
const MAX_W = 2400

function onResizing(clientX: number) {
  const row = rowRef.value
  if (!row) return
  const rect = row.getBoundingClientRect()
  let w = clientX - rect.left
  w = Math.max(MIN_W, Math.min(MAX_W, w))
  sidebarWidth.value = w
  if (!showSidebar.value) showSidebar.value = true
}

const isDragging = ref(false)

/** B 面板滚动容器与内容 */
const box = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

/** 底部检测/是否需要滚动（用于控制 LocateToTop 显示） */
const isAtBottom = ref(false)
const needsScroll = ref(false)
const threshold = 8 // 像素容差

function updateNeedsScroll() {
  const el = box.value
  if (!el) { needsScroll.value = false; isAtBottom.value = false; return }
  needsScroll.value = el.scrollHeight > el.clientHeight + 1
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}

function onScroll() {
  const el = box.value
  if (!el) return
  isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
}

/** 返回顶部 */
const toTop = () => {
  const el = box.value
  if (!el) return

  // 有 scrollTo 就用平滑滚动；否则才用 scrollTop 兜底
  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    el.scrollTop = 0
  }
}


/** 观察容器/内容尺寸变化，自动更新是否需滚动 */
let roBox: ResizeObserver | null = null
let roContent: ResizeObserver | null = null


const treeStore = useSidebarTreeStore()
onMounted(async () => {
  // 1) 初始化（只在首次进入时拉树）
  await treeStore.initIfEmpty(fetchNoteTree)
  // 2) 等一帧，确保 DOM/列表渲染完成
  await nextTick()
  // 3) 先测一次
  updateNeedsScroll()
  // 4) 监听尺寸变化
  if (typeof ResizeObserver !== 'undefined') {
    if (box.value) {
      roBox = new ResizeObserver(updateNeedsScroll)
      roBox.observe(box.value)
    }
    if (contentRef.value) {
      roContent = new ResizeObserver(updateNeedsScroll)
      roContent.observe(contentRef.value)
    }
  }
  // 5) 监听窗口变化
  window.addEventListener('resize', updateNeedsScroll)
})

onBeforeUnmount(() => {
  roBox?.disconnect(); roBox = null
  roContent?.disconnect(); roContent = null
  window.removeEventListener('resize', updateNeedsScroll)
})

/** 路由变化后，等内容渲染完成再测量（确保异步内容、图片等也纳入） */
watch(() => route.fullPath, async () => {
  await nextTick()
  updateNeedsScroll()
})


// 监听 A 抽屉效果是否结束
function onATransitionEnd(e: TransitionEvent) {
  if (e.propertyName === 'transform' && isMarkingA.value) {
    showCloseBtn.value = true // 抽屉完全展开后才显示按钮
  }
}

watch(isMarkingA, (val) => {
  if (!val) {
    showCloseBtn.value = false // 关闭时立即隐藏
  }
})
</script>


<style scoped>
/* 整个页面：上面是顶栏，下面是内容区 */
.layoutHome {
  background-color: #333333;
  /* 黑色背景 */
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-image:
    repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 0 2px, transparent 2px 8px),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.25));
  background-blend-mode: soft-light;
}

.layout {
  background-color: #333333;
  /* 黑色背景 */
  height: 100vh;
  display: flex;
  flex-direction: column;
}


/* --- 变量：--a 控制侧栏宽；--pad 控制 B 的让位；--ax 控制 A 的位移 --- */
.row {
  position: relative;
  --a: 300px;
  --pad: var(--a);
  /* 展开时 B 让位 */
  --ax: 0%;
  --axpx: 0px;
  /* A 在视口内 */
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 收起：A 整块滑到屏外，B 让位归零 */
.row.collapsed {
  --pad: 0px;
  --ax: -100%;
  --axpx: calc(-1 * var(--a));
}

/* A：脱离文档流，整块滑入/滑出，不参与宽度重排 */
.A {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--a);
  overflow: hidden;
  transform: translateX(var(--axpx));
  transition: transform 1s cubic-bezier(.25, 1, .5, 1);
  will-change: transform;
}

/* A 内面板占满（依然可以滚动），不做宽度动画，字体不被挤压 */
.A__panel {
  height: 100%;
  width: 100%;
}

/* B：通过 margin-left 让位/收回（不影响 A 自身布局） */
.B {
  min-width: 0;
  min-height: 0;
  height: 100%;
  margin-left: var(--pad);
  width: calc(100% - var(--pad));
  box-sizing: border-box;
  color: #fff;

  /* 让滚动条在 B 上出现（可保留你之前的设置） */
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable both-edges;

  /* ✨ 关键：同时过渡 margin-left 和 width */
  transition:
    margin-left 1s cubic-bezier(.25, 1, .5, 1),
    width 1s cubic-bezier(.25, 1, .5, 1);
  will-change: margin-left, width;
}

/* 可选：避免过渡过程中出现/消失滚动条导致的跳动 */
.B {
  padding-right: 12px;
  background-clip: content-box;

}

.locate-btn {
  position: absolute;
  right: 36px;
  bottom: 20px;
}

.X {
  height: auto;
  padding: 10px 65px 10px 30px;
  /* 左右缩进，控制小红框宽度 */
  background: inherit;
  /* 背景跟随 B */
}

/* 分隔滑块：永远贴在“可见边界”，跟随 B 的让位 */
.resizer {
  position: absolute;
  top: 0;
  left: calc(var(--a));
  /* 分界线 = B 的左边缘 */
  transform: translateX(-50%);
  /* 居中压线，命中更稳 */
  width: 20px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

/* 拖拽时关动画，跟手 */
.row.dragging .A {
  transition: none !important;
}

.row.dragging .B {
  transition: none !important;
}

/* 使用我们前面做的变量：--a / --axpx */
.close-btn-wrap {
  position: absolute;
  top: 0px;
  left: calc(var(--a) + var(--axpx) - 18px);
  /* 按钮半径修正，让中心对齐边界 */
  z-index: 2000;
  transition: left 1s cubic-bezier(.25, 1, .5, 1);
}


/* 拖拽时关动画 */
.row.dragging .close-btn-wrap {
  transition: none !important;
}
</style>

<!-- 防止整体出现滚动条 -->
<style>
/* 1) 清掉 body 默认外边距，防止 8px 造成横向滚动条 */
html,
body,
#app {
  height: 100%;
  margin: 0;
}

/* 2) 页面外层一律不滚，只允许内部区域滚 */
body {
  overflow: hidden;
  /* 禁止整页滚动 */
}

/* 可选但推荐：盒模型更稳，避免边框/内边距把尺寸挤大 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* 悬停框 */
.el-dropdown__popper {
  --el-bg-color-overlay: rgba(192, 164, 128, 0.664);
  --el-text-color-regular: #fff;
  --el-border-color-lighter: transparent;
}

.el-dropdown-menu__item:hover {
  background-color: rgb(255, 255, 255) !important;
  /* 悬停背景色 */
  color: #747474c2 !important;
  /* 悬停文字色 */
}


/* 对话框 */
/* 只作用于这个对话框（因为用了 modal-class="dim-mask"） */
.el-overlay.dim-mask {
  /* 可选：加深遮罩 */
  background-color: rgba(0, 0, 0, .6);
}

/* 深色弹窗 */
.dim-mask .el-dialog {
  background-color: #222 !important;
  color: #fff;
}

.dim-mask .el-dialog__header {
  background-color: #222 !important;
  border-bottom: 1px solid #444;
}

.dim-mask .el-dialog__title {
  color: #fff !important;
  /* 提高对比度 */
  font-weight: 600;
  /* 可选，粗一点 */
}

.dim-mask .el-dialog__body {
  background-color: #222 !important;
  color: #ddd;
  /* 正文浅灰 */
}

/* 橙色主按钮（不依赖变量，直接改类） */
.dim-mask .el-button--primary {
  background-color: #ff8800cb !important;
  border-color: #ff8800cb !important;
  color: #fff !important;
}

.dim-mask .el-button--primary:hover,
.dim-mask .el-button--primary:focus {
  background-color: #ff9f2e !important;
  border-color: #ff9f2e !important;
}

/* 如果“取消”是朴素按钮（plain），可选地深色化边框/文字 */
.dim-mask .el-button.is-plain {
  background: transparent !important;
  border-color: #666 !important;
  color: #eee !important;
}

.dim-mask .el-button.is-plain:hover {
  border-color: #aaa !important;
  color: #fff !important;
}
</style>