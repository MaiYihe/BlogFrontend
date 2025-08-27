import request from '@/api/http'



export async function fetchViewCount(currentPath: string): Promise<number> {
  const res = await request.get<number>('/note/viewCount', {
    params: { currentPath },
  })
  // 这里的 res 是 AxiosResponse<number>
  return Number(res.data ?? 0)
}


