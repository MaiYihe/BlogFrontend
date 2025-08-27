<template>
  <button class="mask-close-btn" @click="toggle">
    ×
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const toggle = () => {
  emit('update:modelValue', !props.modelValue) // 点击时取反
}
</script>

<style scoped>
.mask-close-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  font-size: 14px;
  font-weight: bold;
  line-height: 20px;
  text-align: center;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}
.mask-close-btn:hover {
  background: rgba(255, 0, 0, 0.8);
}

</style>