<template>
  <div
    class="locate-to-top"
    :class="{ 'is-bottom': atBottom }"
    :style="{ width: sizePx, height: sizePx, '--scale': String(scale) }"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
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
        :href="iconUrl"
        :x="(size - iconSize)/2"
        :y="(size - iconSize)/2"
        :width="iconSize"
        :height="iconSize"
        preserveAspectRatio="xMidYMid meet"
        class="icon"
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
  iconUrl?: string
  ariaLabel?: string
}>(), {
  diameter: 45,
  fill: 'transparent',
  stroke: 'rgba(255, 255, 255, 0.12)',
  strokeWidth: 1,
  iconRatio: 0.55,
  atBottom: false,
  iconUrl: arrowUrl,
  ariaLabel: '回到顶部'
})

const size = computed(() => Math.max(0, props.diameter))
const radius = computed(() => (size.value - props.strokeWidth) / 2) // 把描边算进来，避免裁切
const sizePx = computed(() => `${size.value}px`)
const iconSize = computed(() => Math.round(size.value * props.iconRatio))
const iconUrl = computed(() => props.iconUrl || arrowUrl)
const ariaLabel = computed(() => props.ariaLabel || '回到顶部')

// 动态 scale 值（1 → 1.25）;图标放大缩小
const scale = computed(() => props.atBottom ? 1.25 : 1)

const emit = defineEmits<{
  (e: 'click'): void
}>()

</script>


<style scoped>

.locate-to-top {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  border-radius: 999px;
  cursor: pointer;

  background: rgba(18, 18, 18, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.45),
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 0 0 1px rgba(255, 184, 107, 0.08) inset;

  /* 同时过渡 filter 与 transform */
  transition:
    transform 600ms cubic-bezier(.2,.8,.2,1),
    box-shadow 350ms ease,
    filter 350ms ease;

  transform-origin: center center;
  transform: translateZ(0) scale(var(--scale, 1));
  will-change: transform, filter, box-shadow;
}

.locate-to-top:hover {
  filter: brightness(1.05) saturate(1.08);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 184, 107, 0.18) inset,
    0 0 18px rgba(255, 184, 107, 0.25);
}

.locate-to-top:active {
  transform: translateY(1px) scale(calc(var(--scale, 1) * 0.98));
}

.locate-to-top:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgba(255, 184, 107, 0.35),
    0 12px 26px rgba(0, 0, 0, 0.45);
}

.locate-to-top::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 999px;
  background: radial-gradient(60% 60% at 50% 50%, rgba(255, 184, 107, 0.35), transparent 70%);
  opacity: 0;
  transition: opacity 350ms ease;
  z-index: -1;
}

.locate-to-top:hover::after,
.locate-to-top.is-bottom::after {
  opacity: 0.7;
}

.locate-to-top svg {
  display: block;
}

.locate-to-top .icon {
  filter: invert(1) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
  opacity: 0.95;
  transition: transform 200ms ease, opacity 200ms ease;
}

.locate-to-top.search-fab .icon {
  filter: none;
}

.locate-to-top:hover .icon {
  transform: translateY(-1px);
  opacity: 1;
}

.locate-to-top.is-bottom {
  box-shadow:
    0 18px 36px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 184, 107, 0.28) inset,
    0 0 22px rgba(255, 184, 107, 0.35);
}
</style>
