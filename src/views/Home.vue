<template>
  <section class="home-search" :class="{ 'has-results': panelOpen }">
    <SearchResultsPanel
      v-if="showPanel && !aiEnabled"
      :results="results"
      :loading="loading"
      :error="error"
      :query="lastQuery || query"
      @open-path="openPath"
    />
    <AiChatPanel
      v-else-if="showPanel && aiEnabled"
      :ai-messages="aiMessages"
      :ai-paths="aiPaths"
      :loading="loading"
      :ai-streaming="aiStreaming"
      @open-path="openPath"
    />

    <div class="search-panel">
      <div v-if="!hasSearched && !aiEnabled" class="welcome-box">
        <h1 class="title">
          Welcome to <span class="highlight">Maiyihe</span> Blog
        </h1>
        <p class="subtitle">一个记录思考、分享知识与探索世界的空间</p>

        <el-divider content-position="center">About This Blog</el-divider>

        <p class="paragraph">
          本博客致力于分享编程语言与框架、操作系统与网络、机器/深度学习研究等多元主题。知识的力量在于传播，每一篇文章都是一次思考的沉淀与成长的脚印。
        </p>
        <p class="paragraph">
          无论你是开发者，还是好奇心驱动的探索者，愿你在这里发现灵感，收获价值。
        </p>

        <el-divider content-position="center">Stay Curious, Keep Learning</el-divider>
      </div>
      <div v-if="loading" class="status">加载中...</div>
      <div v-else-if="error" class="status error">{{ error }}</div>

      <div class="search-bar">
        <input
          v-model.trim="query"
          class="search-input"
          type="text"
          placeholder="输入关键词，开始检索或提问..."
          :disabled="aiEnabled && aiStreaming"
          @keydown.enter.prevent="onSearch"
        />
        <button class="search-btn" :disabled="loading || (aiEnabled && aiStreaming)" @click="onSearch" aria-label="搜索">
          <img :src="searchIcon" alt="" class="search-icon" />
        </button>
        <el-tooltip :content="aiTooltip" placement="bottom" :offset="6">
          <button
            class="ai-btn"
            :class="{ active: aiEnabled }"
            type="button"
            @click="toggleAi"
            aria-label="AI"
          >
            <img :src="robotIcon" alt="" class="ai-icon" />
          </button>
        </el-tooltip>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
import searchIcon from '@/assets/icons/search.svg'
import robotIcon from '@/assets/icons/robot.svg'
import { ragChat, ragChatCancel } from '@/api/admin/ragApi'
import { useSidebarTreeStore } from '@/stores/sideBarTree'
import { fetchNoteTree } from '@/api/treeNodeApi'
import { normalizeNode, type TreeNode } from '@/utils/treeNodes'
import SearchResultsPanel from '@/components/home/SearchResultsPanel.vue'
import AiChatPanel from '@/components/home/AiChatPanel.vue'

const router = useRouter()
const route = useRoute()

const query = ref('')
const lastQuery = ref('')
const loading = ref(false)
const error = ref('')
const results = ref<string[]>([])
const hasSearched = ref(false)
const aiEnabled = ref(false)
const aiPaths = ref<string[]>([])
const aiMessages = ref<{ role: 'user' | 'assistant'; content: string }[]>([])
const aiStreaming = ref(false)
let aiStream: EventSource | null = null
const currentTaskId = ref('')
const STORAGE_KEY = 'home.search.state'
const skipRestoreOnce = ref(false)

const forceOpen = computed(() => route.path === '/search' && route.query.open === '1')
const panelOpen = computed(() => hasSearched.value || forceOpen.value || aiEnabled.value)
const showPanel = computed(() => panelOpen.value)
const aiTooltip = computed(() =>
  aiEnabled.value ? '已启用 AI 回复，点击关闭' : '启用 AI 进行回复'
)

function buildSearchQuery(nextAi?: boolean) {
  const q: Record<string, any> = { ...route.query }
  q.open = '1'
  if (nextAi) q.ai = '1'
  else delete q.ai
  return q
}

async function onSearch() {
  if (aiEnabled.value && aiStreaming.value) {
    error.value = '请等待上一条回复完成'
    return
  }
  if (route.path !== '/search') {
    skipRestoreOnce.value = true
    await router.push({ path: '/search', query: buildSearchQuery(aiEnabled.value) })
  } else if (aiEnabled.value && route.query.ai !== '1') {
    await router.push({ path: '/search', query: buildSearchQuery(true) })
  }
  const q = query.value.trim()
  hasSearched.value = true
  error.value = ''
  results.value = []
  if (!q) {
    error.value = '请输入关键词或进行提问'
    return
  }
  loading.value = true
  try {
    if (aiEnabled.value) {
      await cancelAiTask()
      aiPaths.value = []
      aiMessages.value.push({ role: 'user', content: q })
      query.value = ''
      aiMessages.value.push({ role: 'assistant', content: '' })
      const assistantIndex = aiMessages.value.length - 1
      const appendToAssistant = (chunk: string) => {
        const msg = aiMessages.value[assistantIndex]
        if (msg && chunk) msg.content += chunk
      }
      const data = await ragChat(q, 5)
      currentTaskId.value = data?.taskId ?? ''
      aiPaths.value = Array.isArray(data?.paths) ? data.paths : []
      if (data?.streamUrl) {
        startAiStream(data.streamUrl, appendToAssistant)
      } else {
        appendToAssistant('已获取检索结果。')
      }
    } else {
      results.value = await localSearch(q, 50)
      lastQuery.value = q
      query.value = ''
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.response?.data || e?.message || '搜索失败，请稍后重试'
  } finally {
    loading.value = false
    persistState()
  }
}

function openPath(path: string) {
  if (!path) return
  router.push({ name: 'content', query: { notePath: path } })
}

const treeStore = useSidebarTreeStore()

async function localSearch(q: string, limit = 50): Promise<string[]> {
  await treeStore.initIfEmpty(async () => {
    const raw = await fetchNoteTree()
    return raw.map(normalizeNode)
  })
  const lower = q.toLowerCase()
  const out: string[] = []
  const seen = new Set<string>()
  const stack: TreeNode[] = [...treeStore.treeNodes]

  while (stack.length) {
    const node = stack.pop()!
    if (node.children?.length) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]!)
      }
    }
    if (node.folder) continue
    const path = node.currentPath ?? ''
    if (!path) continue
    const hay = `${node.name} ${path}`.toLowerCase()
    if (hay.includes(lower) && !seen.has(path)) {
      seen.add(path)
      out.push(path)
      if (out.length >= limit) break
    }
  }
  return out
}

async function toggleAi() {
  const next = !aiEnabled.value
  if (!next) {
    await cancelAiTask()
    // 关闭 AI 时保持“搜索已打开”状态，避免回到欢迎卡片
    hasSearched.value = true
  }
  aiEnabled.value = next
  if (route.path !== '/search') {
    skipRestoreOnce.value = true
  }
  await router.push({ path: '/search', query: buildSearchQuery(next) })
  persistState()
}

function handleStreamData(raw: string, append: (chunk: string) => void) {
  if (!raw) return
  const handleObj = (obj: any) => {
    if (!obj || typeof obj !== 'object') return
    const type = obj.type
    if (type === 'token') {
      const chunk = typeof obj.content === 'string' ? obj.content : ''
      if (chunk) append(chunk)
      return
    }
    if (type === 'paths') {
      if (Array.isArray(obj.paths)) aiPaths.value = obj.paths
      else if (Array.isArray(obj.content)) aiPaths.value = obj.content
      return
    }
    if (type === 'done') {
      closeAiStream()
      persistState()
      return
    }
    if (typeof obj.content === 'string') {
      append(obj.content)
    }
  }
  try {
    const obj = JSON.parse(raw)
    handleObj(obj)
    return
  } catch {
    // ignore parse errors and fall back to raw text
  }
  if (/}\s*{/.test(raw)) {
    const parts = raw.split(/}\s*{/)
    for (let i = 0; i < parts.length; i++) {
      const piece = i === 0 ? parts[i] + '}' : '{' + parts[i] + (i === parts.length - 1 ? '' : '}')
      try {
        const obj = JSON.parse(piece)
        handleObj(obj)
      } catch {
        append(piece)
      }
    }
    return
  }
  append(raw)
}

function startAiStream(streamUrl: string, append: (chunk: string) => void) {
  aiStreaming.value = true
  const url = streamUrl.startsWith('/') ? streamUrl : `/${streamUrl}`
  aiStream = new EventSource(url)
  aiStream.addEventListener('paths', (ev: MessageEvent) => {
    handleStreamData(ev.data, append)
  })
  aiStream.addEventListener('token', (ev: MessageEvent) => {
    handleStreamData(ev.data, append)
  })
  aiStream.onmessage = (ev: MessageEvent) => {
    handleStreamData(ev.data, append)
  }
  aiStream.addEventListener('done', () => {
    closeAiStream()
    persistState()
  })
  aiStream.onerror = () => {
    closeAiStream()
  }
}

function closeAiStream() {
  if (aiStream) {
    aiStream.close()
    aiStream = null
  }
  aiStreaming.value = false
}

async function cancelAiTask() {
  if (currentTaskId.value) {
    const id = currentTaskId.value
    currentTaskId.value = ''
    closeAiStream()
    try {
      await ragChatCancel(id)
      if (aiEnabled.value) {
        const last = aiMessages.value[aiMessages.value.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          last.content = '任务已中断'
        } else {
          aiMessages.value.push({ role: 'assistant', content: '任务已中断' })
        }
      }
    } catch {
      // ignore cancel errors
    }
  } else {
    closeAiStream()
  }
}

function persistState() {
  try {
    const payload = {
      query: query.value,
      lastQuery: lastQuery.value,
      results: results.value,
      hasSearched: hasSearched.value,
      aiEnabled: aiEnabled.value,
      aiPaths: aiPaths.value,
      aiMessages: aiMessages.value,
      error: error.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return
    query.value = String(data.query ?? '')
    lastQuery.value = String(data.lastQuery ?? '')
    results.value = Array.isArray(data.results) ? data.results : []
    hasSearched.value = !!data.hasSearched
    aiEnabled.value = !!data.aiEnabled
    aiPaths.value = Array.isArray(data.aiPaths) ? data.aiPaths : []
    aiMessages.value = Array.isArray(data.aiMessages) ? data.aiMessages : []
    error.value = String(data.error ?? '')
  } catch {
    // ignore
  }
}

function resetView() {
  query.value = ''
  lastQuery.value = ''
  results.value = []
  hasSearched.value = false
  aiEnabled.value = false
  error.value = ''
  loading.value = false
  aiPaths.value = []
  aiMessages.value = []
  cancelAiTask()
}

onMounted(() => {
  if (route.path === '/search') restoreState()
})

function onHomeReset() {
  if (route.path === '/') resetView()
}

onMounted(() => {
  window.addEventListener('home-reset', onHomeReset)
})

onBeforeUnmount(() => {
  window.removeEventListener('home-reset', onHomeReset)
  cancelAiTask()
})

watch(() => route.path, (p) => {
  if (p === '/search') {
    if (skipRestoreOnce.value) {
      skipRestoreOnce.value = false
    } else {
      restoreState()
    }
  }
  if (p === '/') resetView()
})

watch(
  () => route.query.ai,
  (val) => {
    if (route.path !== '/search') return
    aiEnabled.value = val === '1'
  }
)

const isAiRoute = computed(() => route.path === '/search' && route.query.ai === '1')

watch(isAiRoute, (now, prev) => {
  if (prev && !now) {
    cancelAiTask()
  }
})

onBeforeRouteLeave((to, from) => {
  if (from.path === '/search') {
    if (isAiRoute.value) {
      cancelAiTask()
    }
    const hasQuery = query.value.trim().length > 0
    const hasResults = results.value.length > 0
    if (hasQuery || hasResults || hasSearched.value) {
      treeStore.pushSearchHistory()
    }
  }
})
</script>

<style scoped>
.home-search {
  --home-bottom-gap: 14px;
  height: calc(100vh - var(--topbar-h, 48px) - 20px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px clamp(1.5rem, 4vw, 3rem) calc(16px + var(--home-bottom-gap));
  color: #e6edf3;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.home-search.has-results {
  justify-content: flex-start;
}

.home-search.has-results .search-panel {
  margin-top: auto;
  padding-top: 10px;
}


.search-panel {
  width: min(900px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  position: relative;
  z-index: 1;
}

.welcome-box {
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  padding: 2rem 2.1rem;
  border-radius: 20px;
  backdrop-filter: blur(12px);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  text-align: center;
  transition: transform .25s ease, box-shadow .25s ease;
  outline: 1px solid rgba(255, 255, 255, 0.06);
}

.welcome-box::before {
  content: "";
  position: absolute;
  top: 0;
  left: 12%;
  right: 12%;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  filter: drop-shadow(0 0 6px var(--accent-weak));
}

.welcome-box:hover {
  transform: translateY(-2px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.title {
  font-size: 2.2rem;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: 0.2px;
  color: #ffffff;
  margin-bottom: 0.65rem;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-muted);
  margin-bottom: 1.6rem;
  opacity: 0.95;
}

.paragraph {
  font-size: 1rem;
  line-height: 1.75;
  margin-bottom: 1.1rem;
  color: #dedede;
  text-align: justify;
}

:deep(.el-divider) {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:deep(.el-divider__text) {
  background-color: #2b2b2b !important;
  color: #ffb86bbb !important;
  font-weight: 560;
  font-size: 0.96rem;
  padding: 0 0.9em;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(255, 184, 107, 0.18),
    0 0 14px rgba(255, 184, 107, 0.08);
}

.highlight {
  position: relative;
  color: #ffb86bbb !important;
  background-image: linear-gradient(180deg, transparent 65%, rgba(255, 184, 107, 0.18) 0);
  padding: 0 .12em;
  border-radius: 6px;
  text-shadow: 0 0 12px rgba(255, 184, 107, 0.25);
}

.search-bar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  min-width: 0;
  overflow: hidden;
}

.search-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: #e6edf3;
  font-size: 1.02rem;
  padding: 6px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-input::placeholder {
  color: rgba(230, 237, 243, 0.55);
}

.search-btn {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform .15s ease, border-color .2s ease, background .2s ease;
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-btn:not(:disabled):hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.5);
}

.search-icon {
  width: 18px;
  height: 18px;
  opacity: 0.9;
}

.ai-btn {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform .15s ease, border-color .2s ease, background .2s ease, box-shadow .2s ease;
}

.ai-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.5);
}

.ai-btn.active {
  border-color: rgba(255, 184, 107, 0.65);
  background: rgba(255, 184, 107, 0.18);
  box-shadow:
    0 0 0 2px rgba(255, 184, 107, 0.18) inset,
    0 8px 20px rgba(255, 184, 107, 0.25);
  transform: translateY(-1px);
}

.ai-btn.active::after {
  content: "";
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #ffb86b;
  box-shadow: 0 0 8px rgba(255, 184, 107, 0.8);
}

.ai-icon {
  width: 20px;
  height: 20px;
  opacity: 0.92;
}

.ai-btn.active .ai-icon {
  opacity: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
}

.status {
  font-size: 0.92rem;
  color: rgba(230, 237, 243, 0.7);
}

.status.error {
  color: #ffb4b4;
}

@media (max-width: 640px) {
  .search-bar {
    padding: 6px 8px 6px 12px;
  }
  .search-btn {
    width: 38px;
    height: 38px;
  }
}
</style>
