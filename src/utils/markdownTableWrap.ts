function wrapTables(el: HTMLElement) {
  el.querySelectorAll('table').forEach(t => {
    if (t.parentElement?.classList.contains('md-table-wrap')) return
    const w = document.createElement('div')
    w.className = 'md-table-wrap'
    t.replaceWith(w)
    w.appendChild(t)
  })
}

// 以 v 开头导出，供 <script setup> 直接使用
export const vTableWrap = {
  mounted(el: HTMLElement) { wrapTables(el) },
  updated(el: HTMLElement) { wrapTables(el) },
}
