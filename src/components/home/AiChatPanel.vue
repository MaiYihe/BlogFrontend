<template>
  <div class="results">
    <div class="results-header">
      <span>AI 对话</span>
    </div>

    <div class="chat-panel">
      <div class="chat-list">
        <div v-for="(m, idx) in aiMessages" :key="idx" class="chat-item" :class="m.role">
          <div class="chat-role">{{ m.role === 'user' ? 'YOU' : 'AI' }}</div>
          <div class="chat-bubble" :class="{ 'chat-bubble-md': m.role === 'assistant' }">
            <template v-if="m.role === 'assistant'">
              <MarkdownRender v-if="m.content" :content="m.content" />
              <span v-else class="ai-typing" aria-label="AI 正在输入">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
            </template>
            <template v-else>
              {{ m.content }}
            </template>
          </div>
        </div>
        <div v-if="!loading && aiMessages.length === 0" class="empty">
          请进行提问，每个 IP 每天提问上限 30 次
        </div>
      </div>
      <div v-if="aiPaths.length > 0" class="sources">
        <div class="sources-title">检索来源</div>
        <ul class="sources-list">
          <li v-for="p in aiPaths" :key="p" class="source-item">
            <button class="result-btn" @click="emit('open-path', p)">
              <span class="result-title">{{ fileName(p) }}</span>
              <span class="result-path">{{ p }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownRender from '@/components/MarkdownRender.vue'

defineProps<{
  aiMessages: { role: 'user' | 'assistant'; content: string }[]
  aiPaths: string[]
  loading: boolean
  aiStreaming: boolean
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

.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.chat-item.user {
  justify-content: flex-end;
}

.chat-role {
  font-size: 0.78rem;
  color: rgba(230, 237, 243, 0.6);
  min-width: 34px;
  text-align: right;
}

.chat-item.user .chat-role {
  order: 2;
  text-align: left;
}

.chat-bubble {
  max-width: 70%;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e6edf3;
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: normal;
}

.chat-bubble-md {
  padding: 8px 10px;
}

.chat-bubble-md :deep(.markdown-body) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: 0.95rem;
  color: inherit;
  line-height: 1.55;
  white-space: normal;
}

.chat-bubble-md :deep(.markdown-body > *:first-child) {
  margin-top: 0;
}

.chat-bubble-md :deep(.markdown-body > *:last-child) {
  margin-bottom: 0;
}

.chat-bubble-md :deep(.markdown-body p) {
  margin: 0.35em 0;
}

.chat-bubble-md :deep(.markdown-body ul),
.chat-bubble-md :deep(.markdown-body ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
  list-style-position: outside;
}

.chat-bubble-md :deep(.markdown-body li) {
  margin: 0.25em 0;
  padding-left: 0;
}

.chat-bubble-md :deep(.markdown-body li p) {
  margin: 0;
  display: inline;
}

.chat-bubble-md :deep(pre) {
  margin: 0.6em 0;
}

.chat-item.user .chat-bubble {
  background: rgba(255, 184, 107, 0.12);
  border-color: rgba(255, 184, 107, 0.35);
  white-space: pre-wrap;
}

.ai-typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 1.2em;
}

.ai-typing .dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(230, 237, 243, 0.7);
  animation: ai-dot 1.2s infinite ease-in-out;
}

.ai-typing .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes ai-dot {
  0%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.35;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

.sources {
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  padding-top: 10px;
}

.sources-title {
  font-size: 0.85rem;
  color: rgba(230, 237, 243, 0.7);
  margin-bottom: 8px;
}

.sources-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item .result-btn {
  border-radius: 10px;
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
