<template>
  <div class="locate-to-top" :style="{ width: sizePx, height: sizePx, '--scale': String(scale) }"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter.prevent="emit('click')"
    @keydown.space.prevent="emit('click')"
  >
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" aria-hidden="true">

      <!-- 背景填充圆 -->
      <circle
        :cx="size/2"
        :cy="size/2"
        :r="radius"
        :fill="fill"
        :stroke="stroke"
        :stroke-width="strokeWidth"
      />

      <!-- 图标（置中 + 反色） -->
      <image
        :href="arrowUrl"
        :x="(size - iconSize)/2"
        :y="(size - iconSize)/2"
        :width="iconSize"
        :height="iconSize"
        preserveAspectRatio="xMidYMid meet"
        style="filter: invert(1);" 
      />

    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import arrowUrl from '@/assets/icons/arrow-up-fill.svg?url'

const props = withDefaults(defineProps<{
  /** 直径，单位 px */
  diameter?: number
  /** 填充色 */
  fill?: string
  /** 边框色 */
  stroke?: string
  /** 边框宽度（px） */
  strokeWidth?: number
  /** 图标大小相对直径比例（0~1），默认 0.55 */
  iconRatio?: number
  atBottom?: boolean   // 是否在底部
}>(), {
  diameter: 45,
  fill: '#283031',
  stroke: '#FFFFFF',
  strokeWidth: 2,
  iconRatio: 0.55,
  atBottom: false
})

const size = computed(() => Math.max(0, props.diameter))
const radius = computed(() => (size.value - props.strokeWidth) / 2) // 把描边算进来，避免裁切
const sizePx = computed(() => `${size.value}px`)
const iconSize = computed(() => Math.round(size.value * props.iconRatio))

// 动态 scale 值（1 → 1.25）;图标放大缩小
const scale = computed(() => props.atBottom ? 1.25 : 1)

const emit = defineEmits<{
  (e: 'click'): void
}>()

</script>


<style scoped>

.locate-to-top {
  display: inline-block;
  line-height: 0;

  /* 初始亮度（你写 0.7 实际是 70%，注释可同步改一下） */
  filter: brightness(0.7);

  /* 同时过渡 filter 与 transform */
  transition: filter 0.5s ease, transform 600ms cubic-bezier(.2,.8,.2,1);

  transform-origin: center center;
  transform: scale(var(--scale, 1));
  will-change: transform, filter;
}

.locate-to-top:hover {
  filter: brightness(1);
}

</style>
