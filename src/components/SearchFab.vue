<template>
  <el-tooltip v-if="props.show" content="点击跳转到搜索页面" placement="left" :offset="8" :hide-after="0">
    <LocateToTop
      class="locate-btn search-fab"
      :icon-url="props.iconUrl"
      aria-label="搜索"
      :style="{ bottom: `${props.bottom}px` }"
      @click="emit('click')"
    />
  </el-tooltip>
</template>

<script setup lang="ts">
import LocateToTop from '@/components/LocateToTop.vue'
import searchIcon from '@/assets/icons/search.svg'

const props = withDefaults(defineProps<{
  show?: boolean
  bottom?: number
  iconUrl?: string
}>(), {
  show: true,
  bottom: 20,
  iconUrl: searchIcon,
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

</script>

<style scoped>
.locate-btn {
  position: absolute;
  right: 36px;
  bottom: 20px;
}

.search-fab {
  transition: bottom 280ms ease, transform 280ms ease, opacity 280ms ease;
}
</style>
