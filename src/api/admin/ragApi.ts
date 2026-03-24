import request from '@/api/http'

export interface RagChatResponse {
  taskId: string
  paths: string[]
  streamUrl?: string
}

export async function ragChat(query: string, limit = 5): Promise<RagChatResponse> {
  const { data } = await request.post<RagChatResponse>('/rag/chat', {
    query,
    limit,
  }, {
    timeout: 120000,
  })
  return data
}

export async function ragChatCancel(taskId: string): Promise<void> {
  if (!taskId) return
  await request.post(`/rag/chat/cancel/${taskId}`)
}
