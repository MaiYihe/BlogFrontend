<template>
  <!-- 不带 tooltip 的裸徽章（便于可选使用） -->
  <div
    class="view-badge"
    :class="sizeClass"
    :style="badgeStyle"
    role="status"
    :aria-label="`views ${shownCount}`"
    @click="$emit('click')"
  >
    <img :src="iconUrl" alt="" class="icon" />
    <span class="num">{{ shownCount }}</span>
  </div>

  <!-- 若你想带提示，保留这个即可；不需要的话可以删掉上面那个裸徽章，避免重复 -->
  <el-tooltip
    content="本篇笔记的累计浏览次数"
    placement="bottom"
    :offset="4"
  >
    <div
      class="view-badge"
      :class="sizeClass"
      :style="badgeStyle"
      role="status"
      :aria-label="`views ${shownCount}`"
      @click="$emit('click')"
    >
      <img :src="iconUrl" alt="" class="icon" />
      <span class="num">{{ shownCount }}</span>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import defaultIcon from '../assets/icons/person.svg'
import { fetchViewCount } from '@/api/noteApi' // 需返回 Promise<number>

const props = withDefaults(defineProps<{
  /** 手动指定查询路径；若未提供，则使用路由 query.notePath */
  pathProp?: string
  icon?: string
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  offsetX?: number
  offsetY?: number
  fixed?: boolean
  size?: 'sm' | 'md'
  /** 动画时长（毫秒） */
  duration?: number
}>(), {
  icon: defaultIcon,
  position: 'top-right',
  offsetX: 30,
  offsetY: 10,
  fixed: false,
  size: 'sm',
  duration: 300
})

defineEmits<{ (e: 'click'): void }>()

const route = useRoute()

/** 当前要查询的路径：优先 pathProp，其次 route.query.notePath */
const targetPath = computed(() => {
  return props.pathProp ?? (route.query.notePath as string | undefined)
})

/** 实际展示（带动画）的计数 */
const shownCount = ref<number>(0)
/** 原始最新计数（数据源快照） */
const latestCount = ref<number>(0)

/** 图标与定位样式 */
const iconUrl = computed(() => props.icon || defaultIcon)
const badgeStyle = computed(() => {
  const s: Record<string, string> = {
    position: props.fixed ? 'fixed' : 'absolute',
  }
  if (props.position.includes('right')) s.right = `${props.offsetX}px`
  else s.left = `${props.offsetX}px`
  if (props.position.includes('bottom')) s.bottom = `${props.offsetY}px`
  else s.top = `${props.offsetY}px`
  return s
})
const sizeClass = computed(() => props.size)

/** 取数并做动画 */
async function refetchAndAnimate() {
  if (!targetPath.value) {
    // 没有路径时清零显示
    animateFromTo(shownCount.value ?? 0, 0, props.duration)
    latestCount.value = 0
    return
  }
  try {
    const newVal = await fetchViewCount(targetPath.value)
    // 动画从当前 shownCount 到新值
    animateFromTo(shownCount.value ?? 0, newVal, props.duration)
    latestCount.value = newVal
  } catch (e) {
    console.error('获取浏览量失败:', e)
  }
}

/** 简单的 easeOutCubic 动画 */
function animateFromTo(start: number, target: number, dur = 300) {
  if (dur <= 0) { shownCount.value = Math.round(target); return }
  const t0 = performance.now()
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur)
    const eased = 1 - Math.pow(1 - p, 3)
    shownCount.value = Math.round(start + (target - start) * eased)
    if (p < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

/** 初次挂载 */
onMounted(refetchAndAnimate)

/** 监听：1) 路由变化（包括 query 变化）；2) 手动传入的 pathProp 变化 */
watch(() => route.fullPath, refetchAndAnimate)
watch(() => props.pathProp, refetchAndAnimate)
</script>

<style scoped>
.view-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 999px;

  color: #a5a5a5;
  background: rgba(31,31,31,.86);
  border: 1px solid rgba(255,255,255,.12);

  backdrop-filter: blur(6px);

  line-height: 1;
  user-select: none;
  z-index: 10;
  transition: transform .15s ease, box-shadow .2s ease, opacity .2s ease;
}

.view-badge.sm { font-size: 9px; padding: 6px 10px; }
.view-badge.md { font-size: 14px; padding: 8px 12px; }

.icon { width: 12px; height: 12px; display: block; opacity: .9; }
.num  { font-weight: 600; letter-spacing: .2px; min-width: 1.5ch; text-align: right; }

.view-badge:hover { transform: translateY(-1px);}

@media (prefers-color-scheme: light) {
  .view-badge {
    color: #333;
    background: rgba(255,255,255,.94);
    border-color: rgba(0,0,0,.08);
    box-shadow: 0 6px 16px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.4);
  }
}
</style>
