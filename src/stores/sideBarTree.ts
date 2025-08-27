import { defineStore } from 'pinia'
import type { TreeNode } from '@/utils/treeNodes'

export const useSidebarTreeStore = defineStore('sidebarTree', {
    state: () => ({
        treeNodes: [] as TreeNode[],                 // API 拉回 + 前端生成后的结果
        expandedMap: {} as Record<string, boolean>,  // 用户交互产生
        initialized: false,                          // 防重复初始化
        loading: false as boolean,
        error: '' as string | null,
        _inflight: null as Promise<void> | null,     // 去重并发
    }),

    getters: {
        // 不要写成 readonly
        nodesForView: (s): TreeNode[] => s.treeNodes,
        isExpanded: (s) => (key: string) => !!s.expandedMap[key],
    },

    actions: {
        setTree(nodes: TreeNode[]) {
            this.treeNodes = nodes
            this.initialized = true
            this.error = null
        },
        clearTree() {
            this.treeNodes = []
            this.initialized = false
            this.error = null
        },

        toggleExpand(key: string) {
            this.expandedMap[key] = !this.expandedMap[key]  // Vue3 对新增 key 也响应式
        },
        setExpanded(key: string, val: boolean) {
            this.expandedMap[key] = val
        },
        resetExpanded() {
            this.expandedMap = {}
        },

        // 只在“本轮运行”里首次进入时拉一次；并且并发去重
        async initIfEmpty(fetcher: () => Promise<TreeNode[]>) {
            if (this.initialized && this.treeNodes.length) return
            if (this._inflight) return this._inflight

            this.loading = true
            this.error = null

            this._inflight = (async () => {
                try {
                    const data = await fetcher()
                    this.setTree(data)
                } catch (e: any) {
                    this.error = e?.message ?? '加载失败'
                    this.initialized = false
                    this.treeNodes = []
                    throw e
                } finally {
                    this.loading = false
                    this._inflight = null
                }
            })()

            return this._inflight
        },
    },
})
