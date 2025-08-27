<!-- src/views/Note.vue -->
<template>
  <div class="note-page note-page-scroll">
    <PathReader position="top-right" :offsetX="100" :offsetY="10" />   

    <div v-if="loading" class="state">正在加载...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <MarkdownRender v-else :content="md" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDetailedContent } from '@/api/contentApi'
import MarkdownRender from '@/components/MarkdownRender.vue'
import PathReader from '@/components/PathReader.vue'

defineOptions({ name: 'Note' })

const route = useRoute()

const md = ref('')
const loading = ref(true)
const error = ref('')

// 只关心 notePath，避免 watch 全路径
const notePath = computed(() => {
  const q = route.query.notePath
  if (typeof q === 'string' && q.trim()) return q.trim()
  const p = route.params.notePath
  if (typeof p === 'string' && p.trim()) return p.trim()
  return ''
})

// 记录上一次成功加载的 key，避免重复请求
const lastLoadedKey = ref<string>('')

async function fetchContentOnce(key: string) {
  if (!key) {
    error.value = '缺少 notePath 参数'
    loading.value = false
    md.value = ''
    return
  }
  // 关键：如果和上次一样，直接跳过
  if (key === lastLoadedKey.value) return

  loading.value = true
  error.value = ''
  try {
    const res = await fetchDetailedContent(key)
    md.value = String(res.data ?? '')
    lastLoadedKey.value = key
  } catch (e: any) {
    error.value = e?.response?.data ?? e?.message ?? '获取文章详情失败'
    md.value = ''
  } finally {
    loading.value = false
  }
}

// 首次挂载拉一次
onMounted(() => fetchContentOnce(notePath.value))

// 只有当 notePath 真正变化时才重新拉
watch(notePath, (nv, ov) => {
  if (nv && nv !== ov) fetchContentOnce(nv)
})
</script>


<style scoped>
.note-page-scroll {
  height: 100%;         /* 保证有高度 */
  overflow: auto;       /* 让滚动发生在组件内部 */
}
</style>
