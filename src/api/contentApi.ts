import request from '@/api/http'  // 之前创建的 axios 实例
import type { AxiosResponse } from 'axios'

export function fetchDetailedContent(notePath: string): Promise<AxiosResponse<any>> {
  return request.get('/content/noteDetailedContent', {
    params: { notePath }
  })
}