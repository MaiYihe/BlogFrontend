<template>
   <div class="markdown-body" v-html="html" v-table-wrap></div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import 'katex/dist/katex.min.css'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

import mark from 'markdown-it-mark'           // ==高亮==
import ins from 'markdown-it-ins'             // ++下划线++
import sub from 'markdown-it-sub'             // ~下标~
import sup from 'markdown-it-sup'             // ^上标^
import mdTable from 'markdown-it-multimd-table' // 表格插件
import katexPlugin from 'markdown-it-katex'   // 数学公式（$...$、$$...$$）

import { mdImagesToSigned } from '@/utils/mdImagesToSigned'
import { vTableWrap } from '@/utils/markdownTableWrap'
import axios from 'axios'

// 传入纯文本 Markdown
const props = defineProps<{ content: string }>()

// 渲染结果（可写）
const html = ref('')

// 先声明 md，highlight 里会用到
let md: MarkdownIt

const highlight = (code: string, lang?: string): string => {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return `<pre class="hljs"><code>${hljs.highlight(code, { language: lang }).value}</code></pre>`
    } catch {
      /* ignore */
    }
  }
  // 兜底：用 md 的转义
  return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`
}

// MarkdownIt 实例（一次性创建）
md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight,
})
  .use(katexPlugin)
  .use(mark)
  .use(ins)
  .use(sub)
  .use(sup)
  .use(mdTable, {
    multiline:  true,   // 单元格内多行
    rowspan:    true,   // 行合并
    headerless: true    // 允许无表头
  })

// —— 兼容性预处理：把 Obsidian 的分隔线/列表边界补空行 —— //
function compatPreprocess(src: string): string {
  const lines = (src ?? '').replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []

  const isHrLine = (s: string) => /^[ \t]*-{3,}[ \t]*$/.test(s)
  const isListLine = (s: string) => /^[ \t]*(?:[-*+]\s+|\d+\.\s+)/.test(s)

  let prevWasListLine = false
  const pushBlankOnce = () => { if (out.length && out[out.length - 1] !== '') out.push('') }

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i]
    const next = i + 1 < lines.length ? lines[i + 1] : undefined
    const prev = out.length ? out[out.length - 1] : ''

    if (isHrLine(cur) && prev.trim() !== '') pushBlankOnce()
    if (prevWasListLine && cur.trim() !== '' && !isListLine(cur) && !isHrLine(cur)) pushBlankOnce()

    out.push(cur)

    if (next !== undefined && cur.trim() !== '' && isListLine(next)) pushBlankOnce()
    prevWasListLine = isListLine(cur)
  }
  return out.join('\n')
}

// —— 异步渲染流程 —— //
async function renderNow(raw: string) {
  const pre = compatPreprocess(raw ?? '')
  // 先把 md 图片而是变成带预签名 URL 的标准 Markdown 图片
  const replaced = await mdImagesToSigned(pre)

  // 再交给 markdown-it 渲染
  html.value = md.render(replaced)
}

// 首次 + 后续内容变化时都渲染
watch(
  () => props.content,
  (t) => { void renderNow(t ?? '') },
  { immediate: true }
)
</script>

<style>
/* 可选：简单的暗色排版，自己按需改 */
.markdown-body {
  background: #333;
  color: #e6edf3;
  padding: 1em;
  border-radius: 6px;
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  overflow-x: auto;
}

/* 隐藏 KaTeX 的 MathML 文本，避免重复显示 */
.markdown-body .katex-mathml {
  position: absolute;
  clip: rect(1px, 1px, 1px, 1px); /* 保留给屏幕阅读器用，但视觉隐藏 */
  padding: 0;
  border: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
}

/* 行内/块级代码的最小样式（可删） */
.markdown-body code {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  padding: 0 .35em;
  border-radius: .35rem;
}
.markdown-body pre {
  background: #0b0d10;
  border: 1px solid rgba(255,255,255,.08);
  padding: 12px 14px;
  border-radius: .6rem;
  overflow: auto;
}
.markdown-body pre code {
  background: transparent;
  border: none;
  padding: 0;
}

/* 隐藏 KaTeX 的 MathML 文本，避免重复显示 */
.markdown-body .katex-mathml {
  position: absolute;
  clip: rect(1px, 1px, 1px, 1px); /* 保留给屏幕阅读器用，但视觉隐藏 */
  padding: 0;
  border: 0;
  height: 1px;
  width: 1px;
  overflow: hidden;
}

/* 行内/块级代码的最小样式（可删） */
.markdown-body code {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  padding: 0 .35em;
  border-radius: .35rem;
}
.markdown-body pre {
  background: #0b0d10;
  border: 1px solid rgba(255,255,255,.08);
  padding: 12px 14px;
  border-radius: .6rem;
  overflow: auto;
}
.markdown-body pre code {
  background: transparent;
  border: none;
  padding: 0;
}
.markdown-body {
  --h1-color: #e2725ba1;
  --h2-color: #2e86abd2;
  --h3-color: #d49e17d0;
  --h4-color: #9065c4cb;
  --h5-color: #799941cb; /* 偏雅致的橄榄色 */
  --h6-color: #d7d8deb6; /* 亮灰作为辅助 */
}

/* 标题样式保持干净无下划线 */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin: 1.2em 0 em;
  font-weight: 700;
  line-height: 1.1;
  text-decoration: none;
}
.markdown-body h1 { color: var(--h1-color); }
.markdown-body h2 { color: var(--h2-color); }
.markdown-body h3 { color: var(--h3-color); }
.markdown-body h4 { color: var(--h4-color); }
.markdown-body h5 { color: var(--h5-color); }
.markdown-body h6 { color: var(--h6-color); }



/* Firefox：细滚动条 + 自定义颜色（thumb/track） */
.markdown-body {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,.18) transparent; /* thumb / track */
  /* 可选：避免横向滚动条出现/消失引发布局抖动 */
  scrollbar-gutter: stable both-edges;
}

/* WebKit（Chrome/Edge/Safari） */
.markdown-body::-webkit-scrollbar {
  height: 10px;   /* 横向条高度 */
  width: 10px;    /* 纵向条宽度 */
}

.markdown-body::-webkit-scrollbar-track {
  background: transparent;            /* 轨道透明，融入背景 */
}

.markdown-body::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.18);  /* 半透明亮度，暗色主题的“质感” */
  border-radius: 8px;
  border: 2px solid transparent;      /* 让 thumb 有内边距感 */
  background-clip: padding-box;
}

.markdown-body:hover::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.28);  /* hover 稍微更亮一些 */
}

.markdown-body::-webkit-scrollbar-corner {
  background: transparent;            /* 右下角的方角也透明 */
}

/* 代码块的滚动条，保持一致美术风格 */
.markdown-body pre::-webkit-scrollbar {
  height: 10px;
}
.markdown-body pre::-webkit-scrollbar-track {
  background: transparent;
}
.markdown-body pre::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.18);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
.markdown-body pre:hover::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.28);
}

/* 放到不带 scoped 的 <style>，或用 :deep(.markdown-body mark) 包裹 */
.markdown-body mark {
  background: rgba(255, 221, 87, .22);
  color: inherit;
  padding: 0 .25em;
  border-radius: .35em;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.08);
}



.md-table-wrap {
  overflow-x: auto;              /* 只让表格区域横向滚动 */
  width: 100%;
}

.markdown-body table {
  width: max-content;
  border-collapse: collapse;
  border-spacing: 0;
  margin: 1em 0;
  background: rgba(255,255,255,.02);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 10px;
  overflow: hidden;          /* 让圆角包住内部 */
  display: block;            /* 宽表格可横向滚动 */
  overflow-x: auto;
}

.markdown-body thead th {
  background: rgba(255,255,255,.06);
  color: #e6edf3;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,.12);
}

.markdown-body th,
.markdown-body td {
  padding: .6em .8em;
  border-bottom: 1px solid rgba(255,255,255,.08);
  border-right: 1px solid rgba(255,255,255,.08);  /* 新增竖线 */
  text-align: left;
  vertical-align: top;
  white-space: nowrap;  /* 按需：允许换行可删掉 */
}

/* 最后一列不要右边线，否则表格最右边会双线 */
.markdown-body th:last-child,
.markdown-body td:last-child {
  border-right: none;
}

.markdown-body tbody tr:nth-child(odd) td {
  background: rgba(255,255,255,.03); /* 斑马纹 */
}

/* 表格滚动条与整体风格一致（可选） */
.markdown-body table::-webkit-scrollbar { height: 10px; }
.markdown-body table::-webkit-scrollbar-track { background: transparent; }
.markdown-body table::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,.18);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

</style>

<style scoped>

/* 水平分割线（---） */
.markdown-body hr {
  border: none;
  border-top: 1px solid rgba(255,255,255,.15);
  margin: 1rem 0;
}

/* 图片、表格自适应 */
.markdown-body img,
.markdown-body table { max-width: 100%; }
</style>
