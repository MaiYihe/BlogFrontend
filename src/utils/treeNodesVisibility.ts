// src/utils/treeNodesVisibility.ts
import type { TreeNode } from '@/utils/treeNodes'
import type { TreeNodeVisibilityUpdateRequest } from '@/api/admin/treeNodeApi'

export type NodeType = 'TOPIC' | 'NOTE'

// 统一生成 key
export const keyOf = (n: TreeNode): string =>
  n.id ?? n.currentPath ?? `virtual:${n.name}`

// 兼容：list 可能是 undefined、Node、或者 Node[]
function normalizeToArray(root: TreeNode[] | TreeNode | undefined | null): TreeNode[] {
  if (Array.isArray(root)) return root
  if (root && typeof root === 'object') return [root]
  return [] // 不可遍历时，返回空数组避免崩溃
}

export function findNodeByKey(
  root: TreeNode[] | TreeNode | undefined | null,
  key: string
): TreeNode | null {
  const list = normalizeToArray(root)
  for (const n of list) {
    if (keyOf(n) === key) return n
    if (n.children?.length) {
      const found = findNodeByKey(n.children, key)
      if (found) return found
    }
  }
  return null
}

export function setNodeVisible(
  root: TreeNode[] | TreeNode | undefined | null,
  key: string,
  nextVisible: boolean
): boolean {
  const node = findNodeByKey(root, key)
  if (!node) return false
  node.visible = nextVisible
  return true
}

/* ========= 新增：整棵子树批量设置 visible ========= */

function walkSubtree(node: TreeNode, fn: (n: TreeNode) => void) {
  fn(node)
  if (node.children?.length) {
    for (const c of node.children) walkSubtree(c, fn)
  }
}

/** 将 key 指定的节点及其所有后代的 visible 统一设置为 nextVisible */
export function setSubtreeVisible(
  root: TreeNode[] | TreeNode | undefined | null,
  key: string,
  nextVisible: boolean
): boolean {
  const node = findNodeByKey(root, key)
  if (!node) return false
  walkSubtree(node, (n) => { n.visible = nextVisible })
  return true
}









export interface BuildOptions {
  /** 跳过分类分组节点（isCategoryGroup === true） */
  skipCategoryGroup?: boolean
  /**
   * 如何从节点推断 nodeType
   * 默认：folder ? 'TOPIC' : 'NOTE'
   */
  inferNodeType?: (node: TreeNode) => NodeType
  /**
   * 如何从节点取 path
   * 默认：node.currentPath
   */
  pathSelector?: (node: TreeNode) => string | null | undefined
}

function _flattenVisibility(
  nodes: TreeNode[],
  out: Record<string, { visible: boolean; nodeType: NodeType }>,
  depth: number
) {
  for (const n of nodes) {
    const path = n.currentPath ?? ''
    if (path) {
      out[path] = {
        visible: !!n.visible,
        nodeType: depth === 0 ? 'TOPIC' : 'NOTE', // ✅ 根节点才是 TOPIC
      }
    }
    if (n.children?.length) _flattenVisibility(n.children, out, depth + 1)
  }
}

export function toVisibilityMap(nodes: TreeNode[] | null | undefined) {
  const map: Record<string, { visible: boolean; nodeType: NodeType }> = {}
  if (nodes && nodes.length) _flattenVisibility(nodes, map, 0)
  return map
}

/** 计算差异 -> 请求体 */
export function collectVisibilityChanges(
  baseline: TreeNode[] | null | undefined,
  draft: TreeNode[],
  options?: BuildOptions
): TreeNodeVisibilityUpdateRequest[] {
  const baseMap = toVisibilityMap(baseline)
  const draftMap = toVisibilityMap(draft)

  const changes: TreeNodeVisibilityUpdateRequest[] = []
  for (const [path, d] of Object.entries(draftMap)) {
    const b = baseMap[path]
    if (!b || b.visible !== d.visible) {
      changes.push({ path, visible: d.visible, nodeType: d.nodeType })
    }
  }
  return changes
}

/** 安全深拷贝（优先 structuredClone，失败降级 JSON） */
export function safeClone<T>(x: T): T {
  try {
    // @ts-ignore
    if (typeof structuredClone === 'function') return structuredClone(x)
  } catch { }
  return JSON.parse(JSON.stringify(x)) as T
}

/**
 * 一步完成：算差异 -> 调保存 -> 同步本地基线
 * saveFn: 你的 API 方法 (items) => Promise<any>
 * 返回：保存的条数
 */
export async function confirmVisibilityUpdate(params: {
  baseline: TreeNode[] | null | undefined
  draft: TreeNode[]
  saveFn: (items: TreeNodeVisibilityUpdateRequest[]) => Promise<any>
  options?: BuildOptions
  onNoChange?: () => void
  onSuccess?: (result: any, count: number) => void
  onError?: (e: any) => void
}) {
  const { baseline, draft, saveFn, options, onNoChange, onSuccess, onError } = params
  const changes = collectVisibilityChanges(baseline, draft, options)

  if (changes.length === 0) {
    onNoChange?.()
    return 0
  }

  try {
    const res = await saveFn(changes)
    onSuccess?.(res, changes.length)
    return changes.length
  } catch (e) {
    onError?.(e)
    throw e
  }
}