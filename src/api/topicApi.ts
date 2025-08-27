import request from '@/api/http'  // 之前创建的 axios 实例
export interface TopicCategoryDTO {
  topicId: number | string
  topicName: string
  category: string | null
  /** 后端如果一并返回了路径，可以保留，可选 */
  topicPath?: string
}

/** 获取 TopicCategoryDTO 列表 */
export async function getTopicCategories(): Promise<TopicCategoryDTO[]> {
  const { data } = await request.get<TopicCategoryDTO[]>('/topic/topicCategories')
  return data
}