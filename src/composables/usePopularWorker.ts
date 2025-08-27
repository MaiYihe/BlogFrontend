// usePopularWorker.ts
import PopularWorker from '@/workers/popular.worker?worker&inline'  // ← 关键

export type PopularEntry = { key: string; viewCount: number }

export function usePopularWorker() {
  const worker = new PopularWorker()   // 不再 new URL，也不用 { type:'module' }
  function run(entries: PopularEntry[]) {
    return new Promise<string[]>((resolve, reject) => {
      const onMessage = (e: MessageEvent<{keys:string[]}>) => { cleanup(); resolve(e.data.keys) }
      const onError   = (err:any) => { cleanup(); reject(err) }
      const cleanup = () => { worker.removeEventListener('message', onMessage); worker.removeEventListener('error', onError) }
      worker.addEventListener('message', onMessage)
      worker.addEventListener('error', onError)
      try { worker.postMessage({ entries }) } catch (e) { cleanup(); reject(e) }
    })
  }
  return { run }
}
