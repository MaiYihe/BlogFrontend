// src/composables/useBlockingLoading.ts
import { ElLoading } from 'element-plus'
import { onBeforeUnmount } from 'vue'

export function useBlockingLoading(minVisibleMs = 300, options?: {
  text?: string
  background?: string
}) {
  let instance: ReturnType<typeof ElLoading.service> | null = null
  let openedAt = 0

  function start() {
    if (instance) return
    openedAt = performance.now()
    instance = ElLoading.service({
      lock: true,
      text: options?.text ?? '处理中…',
      background: options?.background ?? 'rgba(34,34,34,0.6)',
    })
  }

  function stop() {
    if (!instance) return
    const elapsed = performance.now() - openedAt
    const remain = Math.max(0, minVisibleMs - elapsed)
    const close = () => { instance?.close(); instance = null }
    if (remain > 0) setTimeout(close, remain)
    else close()
  }

  onBeforeUnmount(stop)
  return { start, stop }
}

export function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}
