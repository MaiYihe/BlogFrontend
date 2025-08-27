<!-- 侧边栏右侧拖动条 -->
<template>
  <div class="resizer" @mousedown="start"></div>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue'

// 定义事件类型
const emit = defineEmits<{
  (e: 'resizing', x: number): void
  (e: 'drag-start'): void
  (e: 'drag-end'): void
}>()

let dragging = false

function start(e: MouseEvent) {
  dragging = true
  emit('drag-start') // ⬅ 通知父组件“拖拽开始”

  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', stop)
  document.body.style.userSelect = 'none' // 防止拖动时选中文本

  emit('resizing', e.clientX)
}

function move(e: MouseEvent) {
  if (!dragging) return
  emit('resizing', e.clientX)
}

function stop() {
  if (!dragging) return
  dragging = false
  document.removeEventListener('mousemove', move)
  document.removeEventListener('mouseup', stop)
  document.body.style.userSelect = ''

  emit('drag-end') // ⬅ 通知父组件“拖拽结束”
}

onBeforeUnmount(stop)
</script>

<style scoped>
.resizer {
  position: absolute;   /* ← 关键 */
  z-index: 5;           /* 覆盖内容，方便拖拽 */
  width: 1px;
  cursor: ew-resize;
  top: 0;
  right: 0;
  bottom: 0;
  background: transparent;
}

/* 创建一个渐变条，默认透明 */
.resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -2px;
  right: 0px;
  opacity: 0;
  width: 4px; /* 视觉宽度 */
  pointer-events: none;

  background: linear-gradient(
    to right,
    transparent 0%,
    rgba(255, 255, 255, 0.322) 45%,
    rgba(238, 142, 53, 0.9) 55%,
    transparent 100%
  );

  transition: opacity 0.5s ease-out;
}

/* 鼠标悬停时，显示渐变背景（淡入） */
.resizer:hover::before {
  opacity: 1;
}
</style>
