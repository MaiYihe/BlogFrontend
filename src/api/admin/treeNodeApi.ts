// src/api/admin/visibilityApi.ts
import request from '@/api/http'

export type NodeType = 'TOPIC' | 'NOTE'

export interface TreeNodeVisibilityUpdateRequest {
  nodeType: NodeType
  path: string
  visible: boolean
}

/** 批量更新可见性（对应后端 @PostMapping("/admin/visibility")） */
export async function updateVisibility(
  items: TreeNodeVisibilityUpdateRequest[]
): Promise<string> {
  const { data } = await request.post<string>('/admin/treeNode/visibility', items)
  return data  // 后端返回 "TreeNode 可见性更新成功"
}