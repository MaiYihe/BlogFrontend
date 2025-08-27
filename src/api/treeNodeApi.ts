import request from '@/api/http'
import type { AxiosResponse } from 'axios'
import type { TreeNode } from '@/utils/treeNodes'

// 如果你有后端返回的节点类型，可以把 any 换成你的 TreeNodeDTO 类型
export async function fetchNoteTree(): Promise<TreeNode[]> {
  const res = await request.get('/treeNode/noteTree')
  return asArray(res)
}

/** 
 * 统一一个小工具：把各种后端格式解成数组
 * 兼容：[], {data: []}, {result: []}, {code:200,data:[]}
 */
export function asArray<T = unknown>(res: AxiosResponse<any> | any): T[] {
  const payload = (res && 'data' in res) ? res.data : res
  if (Array.isArray(payload)) return payload as T[]
  if (Array.isArray(payload?.data)) return payload.data as T[]
  if (Array.isArray(payload?.result)) return payload.result as T[]
  return []
}