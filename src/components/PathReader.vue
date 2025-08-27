<template>
  <!-- 外层容器控制居中 -->
  <div class="path-reader-wrapper">
    <!-- Tooltip 包裹整个 badge -->
    <el-tooltip
      content="本篇笔记的路径"
      placement="bottom"
      :offset="4"
    >
      <div
        class="view-badge"
        :class="size"
        :style="badgeStyle"
        role="status"
        :aria-label="`Path ${pathText}`"
        @click="$emit('click')"
      >
        <span class="num">{{ pathText }}</span>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import { useRoute } from 'vue-router'

// 获取路由对象
const route = useRoute()

const props = withDefaults(defineProps<{
  /** 要展示的路径文本 */
  path?: string
  /** 尺寸 */
  size?: 'sm' | 'md'
}>(), {
  path: '/helloMD/wtf.md/wtf.md',
  size: 'sm',
})

defineEmits<{ (e: 'click'): void }>()

const pathText = computed(() => {
  const raw = route.query.notePath as string | undefined
  if (!raw) return props.path ?? ''   // 如果没有就用 props.path 默认值

  // 如果是以 data/ 开头，就转成 / 开头
  if (raw.startsWith('data/')) {
    return '/' + raw.slice('data/'.length)
  }
  return raw
})

const badgeStyle = computed<CSSProperties>(() => ({
  display: 'inline-flex'
}))

const size = computed(() => props.size)
</script>

<style scoped>
/* 外层包裹，水平居中 */
.path-reader-wrapper {
  text-align: center;   /* ✅ 关键 */
  margin-top: 0px;     /* 可选：和上面内容拉开距离 */
}

.view-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 999px;

  color: #a5a5a5;
  background: rgba(31,31,31,.86);
  border: 1px solid rgba(255,255,255,.12);

  line-height: 1;
  user-select: none;
  z-index: 10;
  max-width: min(92vw, 1000px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.view-badge.sm { font-size: 10px; padding: 8px 10px; }
.view-badge.md { font-size: 14px; padding: 8px 12px; }

.num { font-weight: 600; letter-spacing: .2px; }

.view-badge:hover { transform: translateY(-1px); }
</style>
