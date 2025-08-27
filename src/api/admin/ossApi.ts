import request from '@/api/http'

/** 扫描本地 figures 并上传到 OSS */
export function scanFiguresToOSS() {
  return request.post('/admin/oss/figuresScan')
}
