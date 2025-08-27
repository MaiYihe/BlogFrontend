import request from '@/api/http'

export interface TopicCategoryMarkRequest {
  topicPath: string
  category: string | null
}

/** 批量标记分类 */
export async function markCategory(items: TopicCategoryMarkRequest[]): Promise<string> {
  const { data } = await request.post<string>('/admin/topic/markCategory', items)
  return data // 后端返回 "标记完成！" 之类的字符串
}