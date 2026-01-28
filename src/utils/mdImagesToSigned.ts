// src/utils/mdImagesToSigned.ts
import { fetchFigureUrl } from '../api/ossApi'

/** 去掉 -1_figures 前缀 + 清理路径 */
function normalizeKey(raw: string): string {
  const clean = raw.trim().split(/[?#]/)[0]
  const noLead = clean.replace(/^\.?\//, '')
  const noPrefix = noLead.replace(/^-1_figures\//, '')

  try {
    return decodeURIComponent(noPrefix)   // ✅ 防止 double encode
  } catch {
    return noPrefix
  }
}


/**
 * 把 Markdown 图片 ![alt](path) 转换为 OSS signed URL
 * - 不做前端缓存
 * - 出错时 fallback 为 #
 * - 保留完整日志
 */
export async function mdImagesToSigned(markdown: string): Promise<string> {
  console.log('🧩 mdImagesToSigned CALLED')

  if (!markdown) {
    console.log('🧩 markdown empty, return')
    return ''
  }

  const re = /!\[([^\]]*)\]\(([^)]+)\)/g

  const keys: string[] = []
  const rawPathMap = new Map<string, string>()

  let m: RegExpExecArray | null
  let matchCount = 0

  console.log('🧩 scanning markdown images...')

  while ((m = re.exec(markdown)) !== null) {
    matchCount++

    const alt = m[1]
    const rawPath = m[2].trim()

    console.log('🧩 matched image:', { alt, rawPath })

    // 跳过 http(s)
    if (/^https?:\/\//i.test(rawPath)) {
      console.log('🧩 skip remote url:', rawPath)
      continue
    }

    const key = normalizeKey(rawPath)

    console.log('🧩 normalized key:', { rawPath, key })

    keys.push(key)
    rawPathMap.set(rawPath, key)
  }

  console.log('🧩 total matched images =', matchCount)

  if (!keys.length) {
    console.log('🧩 no keys found, return original markdown')
    return markdown
  }

  // 去重
  const uniq = [...new Set(keys)]
  console.log('🧩 unique keys =', uniq)

  const urlMap = new Map<string, string>()

  console.log('🧩 fetching signed urls...')

  await Promise.all(
    uniq.map(async (key) => {
      try {
        console.log('🌐 fetchFigureUrl CALL ->', key)

        const { url } = await fetchFigureUrl(key)

        console.log('🌐 fetchFigureUrl RESULT <-', { key, url })

        urlMap.set(key, url)
      } catch (err) {
        console.error('❌ fetchFigureUrl FAILED ->', key, err)
        urlMap.set(key, '#')
      }
    })
  )

  console.log('🧩 urlMap final =', Object.fromEntries(urlMap.entries()))
  console.log('🧩 replacing markdown image urls...')

  return markdown.replace(re, (_all, alt, rawPath) => {
    const p = rawPath.trim()

    if (/^https?:\/\//i.test(p)) {
      console.log('🧩 skip replace http:', p)
      return _all
    }

    const key = rawPathMap.get(p)
    const url = key ? urlMap.get(key) : null

    console.log('🧩 replace check:', { rawPath: p, key, url })

    if (!url || url === '#') {
      console.log('🧩 keep original for:', p)
      return _all
    }

    console.log('🧩 replacing:', p, '=>', url)

    return `![${alt}](${url})`
  })
}

