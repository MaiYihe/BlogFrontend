<template>
  <div class="tree-root">
    <SideBarTreeNode
      v-for="(node, idx) in treeData"
      :key="nodeKey(node, idx)"
      :node="node"
      :isMarkingA="props.isMarkingA"
      :isExpanded="isExpanded"
      :toggleExpand="toggleExpand"
      @toggle-visible="handleToggleVisible"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, toRaw, nextTick, watch, ref } from 'vue'
import SideBarTreeNode from './SideBarTreeNode.vue'
import { fetchNoteTree } from '@/api/treeNodeApi'
import {
  normalizeNode,
  clone,
  type TreeNode,
  groupByCategoryAtRoot,
  groupByAlpha,
  groupByPopular, // 仅作为回退
  nodeKey as makeNodeKey
} from '@/utils/treeNodes'
import { findNodeByKey, setNodeVisible, setSubtreeVisible } from '@/utils/treeNodesVisibility'
import { storeToRefs } from 'pinia'
import { useSidebarTreeStore } from '@/stores/sideBarTree'
import { usePopularWorker, type PopularEntry } from '@/composables/usePopularWorker'
import { useUltraLightLoading } from '@/composables/useUltraLightLoading'

// ------- 类型 -------
type Mode = 'group-category' | 'alpha' | 'popular'

// ------- 事件 -------
const emit = defineEmits<{
  (e: 'loaded', payload: TreeNode[]): void
  (e: 'tree-updated', payload: TreeNode[]): void
}>()

// ------- Pinia -------
const store = useSidebarTreeStore()
const { nodesForView } = storeToRefs(store)

// ------- 父组件传入（受控） -------
const props = defineProps<{
  isMarkingA: boolean
  mode: Mode
  nodes?: TreeNode[]            // 受控渲染（如标记模式的 draftTree）；不传时走 Pinia
}>()

// ------- 首次加载 -------
onMounted(async () => {
  if (props.nodes === undefined) {
    await store.initIfEmpty(async () => {
      const raw = await fetchNoteTree()
      return raw.map(normalizeNode)
    })
    emit('loaded', structuredClone(toRaw(nodesForView.value)))
  } else {
    await nextTick()
    emit('loaded', structuredClone(toRaw(props.nodes)))
  }
})

// ------- 渲染源 -------
const baseSource = computed<TreeNode[]>(() => props.nodes ?? nodesForView.value)

// ------- 结果 & Loading -------
const result = ref<TreeNode[]>([])
const { run: runPopular } = usePopularWorker()
const { start, stop } = useUltraLightLoading(500, '正在生成树…')

// ========== 新增 ①：两次 RAF & 让出主线程工具 ==========
const twoRaf = () => new Promise<void>(r =>
  requestAnimationFrame(() => requestAnimationFrame(() => r()))
)
function yieldToNextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

// ========== 新增 ②：分帧遍历工具（每帧 8ms） ==========
async function forEachNodeChunked(
  roots: TreeNode[],
  visit: (n: TreeNode) => void,
  timeBudgetMs = 8
) {
  const stack: TreeNode[] = [...roots]
  while (stack.length) {
    const start = performance.now()
    do {
      const n = stack.pop()!
      visit(n)
      if (n.folder && n.children?.length) {
        for (let i = n.children.length - 1; i >= 0; i--) stack.push(n.children[i]!)
      }
    } while (stack.length && performance.now() - start < timeBudgetMs)
    if (stack.length) await yieldToNextFrame()
  }
}

// ========== 新增 ③：分帧收集 popular entries ==========
async function collectPopularEntriesChunked(nodes: TreeNode[]): Promise<PopularEntry[]> {
  const out: PopularEntry[] = []
  await forEachNodeChunked(nodes, (n) => {
    if (!n.folder) {
      const key = n.id ?? n.currentPath ?? makeNodeKey(n) ?? `k:${n.name}`
      out.push({ key, viewCount: n.viewCount ?? 0 })
    }
  })
  return out
}

// ========== 新增 ④：分帧构建 key 索引 ==========
async function buildIndexByKeyChunked(nodes: TreeNode[]): Promise<Map<string, TreeNode>> {
  const map = new Map<string, TreeNode>()
  await forEachNodeChunked(nodes, (n) => {
    const key = n.id ?? n.currentPath ?? makeNodeKey(n) ?? `k:${n.name}`
    map.set(key, n)
  })
  return map
}

// ========== 新增 ⑤：增量挂载（分批推入 result） ==========
async function renderIncrementally(
  items: TreeNode[],
  batch: number,
  ticket: number
) {
  // 不替换引用，直接就地修改，减少依赖更新
  result.value.length = 0
  for (let i = 0; i < items.length; i += batch) {
    if (ticket !== inflight) return // 有新一轮刷新就中止旧任务
    result.value.push(...items.slice(i, i + batch))
    await yieldToNextFrame()
  }
}

function calcSync(mode: Mode, base: TreeNode[]) {
  switch (mode) {
    case 'group-category': return groupByCategoryAtRoot(base)
    case 'alpha':          return groupByAlpha(base)
    case 'popular':        return groupByPopular(base) // 回退
    default:               return base.map(clone)
  }
}

// ------- watcher：动画优先 + popular 分帧 + 增量挂载 -------
let inflight = 0

watch(
  [() => props.mode, baseSource],
  async ([mode, base]) => {
    const ticket = ++inflight

    start()
    await nextTick()
    await twoRaf() // 让遮罩与动画先启动

    try {
      if (mode === 'popular') {
        // 1) 分帧收集仅需的数据（key/viewCount）
        const entries = await collectPopularEntriesChunked(base)
        // 2) worker 内排序，返回 keys
        const keys = await runPopular(entries)
        // 3) 分帧构建 key -> node 索引
        const index = await buildIndexByKeyChunked(base)
        // 4) 组装最终顺序（尽量用原对象，减少 clone 带来的 GC）
        const ordered: TreeNode[] = []
        for (const k of keys) {
          const n = index.get(k)
          if (n && !n.folder) ordered.push(n)
        }
        // 5) ★★ 增量挂载：每帧插入 200 条（可按你的数据规模调整）
        await renderIncrementally(ordered, 200, ticket)

      } else {
        // 非 popular 仍同步计算
        const out = calcSync(mode as Mode, base)
        // 如果量很大，同样用增量挂载避免一次性渲染掉帧
        if (Array.isArray(out) && out.length > 500) {
          await renderIncrementally(out, 200, ticket)
        } else {
          if (ticket === inflight) result.value = out
        }
      }
    } catch (err) {
      console.warn('[popular] worker 失败，回退同步计算：', err)
      const out = groupByPopular(base)
      // 回退时也用增量挂载
      await renderIncrementally(out, 200, ticket)
    } finally {
      if (ticket === inflight) stop()
    }
  },
  {
    immediate: true,
    flush: 'post',
    // deep: true  // 建议先不要 deep，避免深比较造成卡顿
  }
)

const treeData = computed(() => result.value)

// ------- 可见性开关 -------
function handleToggleVisible(payload: { key: string; nextVisible: boolean }) {
  const next = structuredClone(toRaw(baseSource.value))
  const node = findNodeByKey(next, payload.key)
  if (!node) return
  node.folder
    ? setSubtreeVisible(next, payload.key, payload.nextVisible)
    : setNodeVisible(next, payload.key, payload.nextVisible)
  emit('tree-updated', next)
}

// ------- 展开/折叠 -------
const toggleExpand = (key: string) => store.toggleExpand(key)
const isExpanded  = (key: string) => store.isExpanded(key)

// ------- 暴露方法 -------
defineExpose({
  setNodes(next: TreeNode[]) {
    if (props.nodes === undefined) {
      store.setTree(structuredClone(toRaw(next)))
    }
  },
  getNodes(): TreeNode[] {
    return structuredClone(toRaw(baseSource.value))
  }
})

// ------- node key（稳定） -------
const nodeKey = (n: TreeNode, i: number) =>
  n.id ?? n.currentPath ?? makeNodeKey(n) ?? `vk:${i}:${n.name}`
</script>


<style scoped></style>
