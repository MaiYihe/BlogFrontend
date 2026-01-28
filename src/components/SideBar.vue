<!-- Sidebar.vue -->
<template>
  <aside class="sidebar">
    <!-- 目录树渲染 -->
    <!-- 子组件依赖从外部（父组件）传入的 expandedMap、toggleExpand 和 isExpanded 来决定节点是否展开、如何处理点击等逻辑 -->
    <div class="scroll-area">
      <SideBarTreeNodes ref="treeRef" :isMarkingA="isMarkingA" :mode="mode" :nodes="nodesProp" @loaded="onLoaded"
        @tree-updated="onTreeUpdated" />
    </div>

    <!-- 悬浮底部固定区域 -->
    <SideBarFooter v-model="isMarkingA" @change-mode="handleChangeMode" v-model:open="showUploadConfirm"
      @confirm="handleConfirm" @cancel="handleCancel" />

    <!-- 覆盖 SideBar（A的区域） 的黑色蒙版 -->
    <transition name="fade">
      <div v-if="isMarkingA" class="a-mask"></div>
    </transition>

  </aside>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, computed, watch, toRaw } from 'vue'
import SideBarFooter from './SideBarFooter.vue'
import SideBarTreeNodes from './SideBarTreeNodes.vue'
import { TreeNode } from '@/utils/treeNodes';
import { updateVisibility } from '@/api/admin/treeNodeApi'
import {
  confirmVisibilityUpdate
} from '@/utils/treeNodesVisibility'

const isMarkingA = defineModel<boolean>('isMarkingA', { default: false })

const treeRef = ref<InstanceType<typeof SideBarTreeNodes> | null>(null)
const committedTree = ref<TreeNode[]>([])
const baselineTree = ref<TreeNode[] | null>(null)
const draftTree = ref<TreeNode[]>([])
const hasLoaded = ref(false)   // ← 新增：是否已拿到首次树数据

/** 深拷贝：先去掉 Vue 的 Proxy，再 structuredClone */
const copy = <T>(x: T): T => structuredClone(toRaw(x as any))

// ✅ 从父组件接收传入的 props
// 把这些 props 设为可选并给默认值，这样在模板/传给子组件时永远不是 undefined
const props = withDefaults(defineProps<{
  toggleExpand?: (id: string) => void
  isExpanded?: (id: string) => boolean
}>(), {
  toggleExpand: () => { },
  isExpanded: () => false,
})

type Mode = 'group-category' | 'alpha' | 'popular'
const mode = ref<Mode>('group-category')   // 只是默认值，用户点了会改
const handleChangeMode = (m: Mode) => { mode.value = m }



// 子组件首次加载完，把“完整树”给父保存为 committed
function onLoaded(initial: TreeNode[]) {
  committedTree.value = initial
  hasLoaded.value = true
}
// 子组件编辑时发上来的 “变更后整棵树”
function onTreeUpdated(next: TreeNode[]) {
  draftTree.value = next
}

watch(isMarkingA, (val) => {
  if (val) {
    // 进入上传模式
    if (!baselineTree.value) {
      baselineTree.value = copy(committedTree.value)
      draftTree.value = copy(committedTree.value)
    }
    treeRef.value?.setNodes(draftTree.value)
    // 如需同时弹出确认框，可这里开：
    // showUploadConfirm.value = true
  } else {
    // 退出上传模式（回退 + 清理）
    if (baselineTree.value) {
      draftTree.value = copy(baselineTree.value)
      treeRef.value?.setNodes(draftTree.value)
    }
    baselineTree.value = null
  }
})

const showUploadConfirm = ref(false)//  弹窗默认关闭
function handleCancel() {
  // 取消的业务逻辑（可选）
  // 实际上没有逻辑
}


const nodesProp = computed<TreeNode[] | undefined>(() => {
  if (!hasLoaded.value) return undefined           // 只发生在第一次
  return isMarkingA.value ? draftTree.value : committedTree.value
})

async function handleConfirm() {
  try {
    await confirmVisibilityUpdate({
      baseline: baselineTree.value,
      draft: draftTree.value,
      saveFn: updateVisibility,
      onNoChange: () => ElMessage.info('没有可更新的可见性变更'),
      onSuccess: (_res, n) => ElMessage.success(`已更新 ${n} 条可见性`),
      onError: (e) => ElMessage.error(e?.response?.data || '更新失败'),
    })

    // 用最新草稿作为“展示入口”的那一份（关键点）
    const latest = draftTree.value
    draftTree.value = latest
    committedTree.value = latest
    baselineTree.value = latest.map(x => x)
  } catch { }
}

</script>



<style scoped>
/* 侧边栏整体样式 */
.sidebar {
  flex: 1 1 auto;
  /* 自动占满父容器剩余的列宽 */
  position: relative;
  /* ← 让子元素的 absolute 以它为参照 */
  left: 0;
  top: 0;
  height: 100%;
  display: flex;
  /* 改成 Flex 布局 */
  flex-direction: column;
  /* 垂直排列 */

  background-color: #272727c4;
  color: white;
  padding: 0rem;
  padding-top: 0.5rem;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.3);
  overflow: auto;
}

.scroll-area {
  flex: 1;
  /* 占据剩余空间 */
  min-height: 0;
  /* 允许滚动 */
  overflow-y: auto;
  /* 只让中间区域滚动 */
}

/* WebKit 系 */
.scroll-area::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  /* 横向滚动条的厚度 */
}

.scroll-area::-webkit-scrollbar-track {
  background: #222;
  /* 轨道色 */
}

.scroll-area::-webkit-scrollbar-thumb {
  background: #888;
  /* 滑块色 */
  border-radius: 4px;
  border: 2px solid #222;
  /* 与轨道留间隙感 */
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

/* 关键：右下角的拐角 */
.scroll-area::-webkit-scrollbar-corner {
  background: #222;
  /* 不要留白 */
}

/* 蒙版区域 */
.a-mask {
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 65px;
  /* 底部多留一些空隙 */
  left: 0px;
  border: 2px dashed white;
  box-sizing: border-box;
  /* 关键：让事件穿透 */
  pointer-events: none;

}
</style>
