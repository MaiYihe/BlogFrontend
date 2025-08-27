/** 后端 TreeNodeDTO 在前端的干净类型 */
export type TreeNode = {
  id: string | null
  /** 仅当你需要做分类/字母分组时可选带上 */
  category?: string | null
  isCategoryGroup?: boolean | false //判断是否是 category
  folder: boolean
  currentPath: string | null
  name: string
  viewCount: number
  visible: boolean  
  children: TreeNode[]
}

/** 从后端原始返回“脏结构”转换成干净的 TreeNode（可选：在接口层调用） */
export function normalizeNode(dto: any): TreeNode {
  return {
    id: dto?.id ?? null,
    folder: !!dto?.folder,
    currentPath: dto?.currentPath ?? null,
    name: String(dto?.name ?? ''),
    viewCount: Number(dto?.viewCount ?? 0),
    visible: dto?.visible === true || dto?.visible === 'true',
    category: dto?.category ?? null,
    children: Array.isArray(dto?.children) ? dto.children.map(normalizeNode) : [],
  }
}

/** 深拷贝（只拷贝 Node 结构，不保留引用） */
export function clone(n: TreeNode): TreeNode {
  return {
    ...n, // 拷贝所有字段，包括 viewCount
    children: n.children ? n.children.map(clone) : [], // 避免 undefined 报错
  }
}

/** 拍平为叶子列表（常用于分组/排序） */
// 把传进来的树形结构（多层嵌套的节点）拍平成一个一维数组
export function flatten(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = []
  const walk = (arr: TreeNode[]) => {
    for (const n of arr) {
      if (n.children.length) walk(n.children)
      else out.push(n)
    }
  }
  walk(nodes)
  return out
}

export function nodeKey(n: { id: string|null, currentPath: string|null, name: string }, idx?: number) {
  if (n.id) return n.id;                         // 后端节点：用 id
  if (n.currentPath) return `path:${n.currentPath}`; // 没 id：用路径
  return `virtual:${n.name}${idx != null ? `:${idx}` : ''}`; // 虚拟节点：name+下标兜底
}



/** 按分类分组 */
// 仅按“根层节点”的 category 分组
export function groupByCategoryAtRoot(nodes: TreeNode[]): TreeNode[] {
  // 工具：把 null/空白 都归为 'Uncategorized'
  const norm = (s?: string | null) => {
    const t = (s ?? '').trim()
    return t.length ? t : 'Uncategorized'
  }

  // 1) 仅遍历根层节点，按 category 分桶
  const groups = new Map<string, TreeNode[]>()
  for (const root of nodes) {
    const key = norm(root.category)
    if (!groups.has(key)) groups.set(key, [])
    // 放克隆，避免修改原始 nodes
    groups.get(key)!.push(clone(root))
  }

  // 2) 组名排序（不区分大小写），Uncategorized 放最后
  const keys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b)
  })

  // 3) 生成“虚拟分组节点”这一层；children 就是对应的根节点们
  return keys.map(name => ({
    id: `group:category:${name}`,  // 稳定伪ID，避免与后端ID冲突
    name,
    isCategoryGroup:true,
    folder: true,
    currentPath: null,
    viewCount: 0,
    visible: true,
    children: groups.get(name)!   // 这里已经是 clone 过的根节点，保留其原有 children
  }))
}

/** 按首字母分组（非 A-Z 归为 #）。后端默认返回的效果已经实现 */
export function groupByAlpha(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(clone)
}

/** 按热度分组（单组 Popular，内部按 viewCount 降序） */
export function groupByPopular(nodes: TreeNode[]): TreeNode[] {
  // 先拍平成一层
  const flat = flatten(nodes)
  // 只要“文件”（排除文件夹）
  const filesOnly = flat.filter(n => !n.folder)
  // 按热度从高到低排序（不改原数组，用 slice() 复制一份再排）
  const sorted = filesOnly.slice().sort(
    (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
  )
  // 返回克隆后的列表（避免外部修改原节点）
  return sorted.map(clone)
}
