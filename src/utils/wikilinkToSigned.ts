// src/utils/wikilinkToSigned.ts
import { fetchFigureUrl } from '../api/ossApi'


/** 裸文件名时补默认前缀 */
function normalizeKey(raw: string): string {
  return raw.trim()
}

/**
 * 把 Markdown 中的 ![[key|alt]] 转成标准 Markdown 图片 ![alt](signed-url)
 * - 简洁版：不做前端内存缓存
 * - 出错时用 # 占位，避免整段渲染失败
 */
export async function wikilinkImagesToSigned(markdown: string): Promise<string> {
  if (!markdown) return ''

  const re = /!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g

  // 收集所有 key
  const keys: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(markdown)) !== null) {
    keys.push(normalizeKey(m[1]))
  }
  if (keys.length === 0) return markdown

  // 去重后并行请求
  const uniq = [...new Set(keys)]
  const urlMap = new Map<string, string>()

  await Promise.all(
    uniq.map(async (k) => {
      try {
        const { url } = await fetchFigureUrl(k) // 返回 PresignResp
        urlMap.set(k, url)
      } catch {
        urlMap.set(k, '#')
      }
    })
  )

  // 替换
  return markdown.replace(re, (_all, rawKey: string, alt?: string) => {
    const key = normalizeKey(rawKey)
    const url = urlMap.get(key) ?? '#'
    const safeAlt = (alt ?? '').trim()
    return `![${safeAlt}](${url})`
  })
}
