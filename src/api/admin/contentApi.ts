import request from '@/api/http'  // 之前创建的 axios 实例

export function contentScan() {
  // 给它 10 分钟响应
  return request.post('/admin/content/scan', null, { timeout: 600_000 })
}