<template>
  <div class="results">
    <div class="results-header">
      <span class="summary">
        <template v-if="query">
          检索 {{ query }} 返回 {{ results.length }} 条
        </template>
        <template v-else>
          检索结果
        </template>
      </span>
    </div>

    <ul class="results-list">
      <li v-for="p in results" :key="p" class="result-item">
        <button class="result-btn" @click="emit('open-path', p)">
          <span class="result-title">{{ fileName(p) }}</span>
          <span class="result-path">{{ p }}</span>
        </button>
      </li>
      <li v-if="!loading && results.length === 0 && !error" class="empty">
        <template v-if="query">没有检索到相关内容</template>
        <template v-else>请输入关键词</template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  results: string[]
  loading: boolean
  error: string
  query: string
}>()

const emit = defineEmits<{
  (e: 'open-path', path: string): void
}>()

function fileName(path: string) {
  const parts = path.split('/')
  return parts[parts.length - 1] || path
}
</script>

<style scoped>
.results {
  width: min(900px, 100%);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 12px 6px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.results::-webkit-scrollbar {
  width: 8px;
}
.results::-webkit-scrollbar-track {
  background: transparent;
}
.results::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 8px;
}
.results:hover::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  color: rgba(230, 237, 243, 0.75);
  padding: 4px 6px 10px;
}

.count {
  font-variant-numeric: tabular-nums;
}

.results-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.result-item {
  margin-bottom: 8px;
}

.result-btn {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
  padding: 10px 12px;
  color: #e6edf3;
  cursor: pointer;
  transition: border-color .2s ease, background .2s ease, transform .15s ease;
  overflow: hidden;
}

.result-btn:hover {
  border-color: rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-1px);
}

.result-title {
  display: block;
  font-weight: 600;
  font-size: 0.98rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-path {
  display: block;
  font-size: 0.82rem;
  color: rgba(230, 237, 243, 0.6);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  padding: 10px 8px 12px;
  color: rgba(230, 237, 243, 0.6);
  font-size: 0.92rem;
}
</style>
