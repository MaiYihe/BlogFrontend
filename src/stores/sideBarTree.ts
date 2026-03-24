import { defineStore } from 'pinia'
import type { TreeNode } from '@/utils/treeNodes'

const EXPANDED_STORAGE_KEY = 'sidebarTree.expandedMap'
const HISTORY_MAX = 10

type HistoryEntry =
    | { type: 'note'; notePath: string; expandedMap: Record<string, boolean>; ts: number }
    | { type: 'search'; expandedMap: Record<string, boolean>; ts: number }

export const useSidebarTreeStore = defineStore('sidebarTree', {
    state: () => ({
        treeNodes: [] as TreeNode[],                 // API 拉回 + 前端生成后的结果
        expandedMap: {} as Record<string, boolean>,  // 用户交互产生
        initialized: false,                          // 防重复初始化
        loading: false as boolean,
        error: '' as string | null,
        _inflight: null as Promise<void> | null,     // 去重并发
        history: [] as HistoryEntry[],
        _skipNextHistoryPush: false,
    }),

    getters: {
        // 不要写成 readonly
        nodesForView: (s): TreeNode[] => s.treeNodes,
        isExpanded: (s) => (key: string) => !!s.expandedMap[key],
    },

    actions: {
        hydrateExpanded() {
            try {
                const raw = localStorage.getItem(EXPANDED_STORAGE_KEY)
                if (!raw) return
                const obj = JSON.parse(raw)
                if (obj && typeof obj === 'object') {
                    this.expandedMap = obj
                }
            } catch {
                // ignore parse errors
            }
        },
        persistExpanded() {
            try {
                localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(this.expandedMap))
            } catch {
                // ignore write errors
            }
        },
        clearPersistedExpanded() {
            try {
                localStorage.removeItem(EXPANDED_STORAGE_KEY)
            } catch {
                // ignore
            }
        },
        markSkipNextHistoryPush() {
            this._skipNextHistoryPush = true
        },
        pushNoteHistory(notePath: string) {
            if (!notePath) return
            if (this._skipNextHistoryPush) {
                this._skipNextHistoryPush = false
                return
            }
            const last = this.history[this.history.length - 1]
            if (last?.type === 'note' && last?.notePath === notePath) {
                last.expandedMap = { ...this.expandedMap }
                last.ts = Date.now()
                return
            }
            this.history.push({
                type: 'note',
                notePath,
                expandedMap: { ...this.expandedMap },
                ts: Date.now(),
            })
            if (this.history.length > HISTORY_MAX) {
                this.history.splice(0, this.history.length - HISTORY_MAX)
            }
        },
        pushSearchHistory() {
            const last = this.history[this.history.length - 1]
            if (last?.type === 'search') {
                last.ts = Date.now()
                last.expandedMap = { ...this.expandedMap }
                return
            }
            this.history.push({
                type: 'search',
                expandedMap: { ...this.expandedMap },
                ts: Date.now()
            })
            if (this.history.length > HISTORY_MAX) {
                this.history.splice(0, this.history.length - HISTORY_MAX)
            }
        },
        popHistory() {
            return this.history.pop() ?? null
        },
        applyExpandedMap(map: Record<string, boolean>) {
            this.expandedMap = { ...map }
            this.persistExpanded()
        },
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
            this.persistExpanded()
        },
        setExpanded(key: string, val: boolean) {
            this.expandedMap[key] = val
            this.persistExpanded()
        },
        resetExpanded() {
            this.expandedMap = {}
            this.persistExpanded()
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
