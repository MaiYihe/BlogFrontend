/// <reference lib="webworker" />

// 主线程会只发 { key, viewCount } 的轻量数组进来
type PopularEntry = { key: string; viewCount: number }

self.onmessage = (e: MessageEvent<{ entries: PopularEntry[] }>) => {
  const entries = e.data.entries || []
  // 在 worker 里排序（避免阻塞主线程）
  const sorted = entries.slice().sort((a, b) => b.viewCount - a.viewCount)
  const keys = sorted.map(s => s.key)
  ;(self as DedicatedWorkerGlobalScope).postMessage({ keys })
}

export {}