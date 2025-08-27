// src/typings/markdown.d.ts

// 常见声明：让 ts 认识 .vue、Vite 资产等（若你已有 env.d.ts 可合并）
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.svg?url' {
  const src: string
  export default src
}

// ---- markdown / plugins ----
declare module 'markdown-it' {
  // 如果你已安装 @types/markdown-it，可以删掉这个块，交给 @types
  // 这里给个最小可用的声明，避免 any 飘红
  export type Options = {
    html?: boolean
    xhtmlOut?: boolean
    breaks?: boolean
    langPrefix?: string
    linkify?: boolean
    typographer?: boolean
    highlight?: (str: string, lang?: string) => string
  }
  export default class MarkdownIt {
    constructor(options?: Options)
    render(src: string): string
    use(plugin: (md: MarkdownIt, ...params: any[]) => void, ...params: any[]): this
    utils: { escapeHtml(s: string): string }
  }
}

declare module 'markdown-it-mark' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
declare module 'markdown-it-ins' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
declare module 'markdown-it-sub' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
declare module 'markdown-it-sup' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
declare module 'markdown-it-katex' {
  import type MarkdownIt from 'markdown-it'
  const plugin: (md: MarkdownIt) => void
  export default plugin
}
