// src/composables/useUltraLightLoading.ts
let styleInjected = false

function injectStyle() {
  if (styleInjected) return
  styleInjected = true
  const css = `
  .uload-mask {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999;
    /* 避免重排：单层容器 + GPU 合成 */
    will-change: opacity;
  }
  .uload-box {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 16px 18px; border-radius: 12px;
    background: rgba(24,24,24,0.75);
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    transform: translateZ(0); /* GPU 合成层 */
  }
  .uload-spinner {
    width: 28px; height: 28px;
    border: 2px solid rgba(255,255,255,0.28);
    border-top-color: #fff;
    border-radius: 50%;
    animation: uload-spin 0.9s linear infinite;
    will-change: transform;
  }
  .uload-text {
    font-size: 13px; color: #fff; opacity: 0.9;
    user-select: none;
  }
  @keyframes uload-spin {
    to { transform: rotate(360deg); }
  }
  `
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)
}

export function useUltraLightLoading(minVisibleMs = 300, text = '处理中…') {
  injectStyle()

  let mask: HTMLDivElement | null = null
  let openedAt = 0

  function start() {
    if (mask) return
    openedAt = performance.now()
    mask = document.createElement('div')
    mask.className = 'uload-mask'
    mask.innerHTML = `
      <div class="uload-box" role="status" aria-live="polite" aria-busy="true">
        <div class="uload-spinner" aria-hidden="true"></div>
        <div class="uload-text">${text}</div>
      </div>`
    document.body.appendChild(mask)
  }

  function stop() {
    if (!mask) return
    const elapsed = performance.now() - openedAt
    const remain = Math.max(0, minVisibleMs - elapsed)
    const close = () => {
      if (mask && mask.parentNode) mask.parentNode.removeChild(mask)
      mask = null
    }
    if (remain > 0) setTimeout(close, remain)
    else close()
  }

  return { start, stop }
}
