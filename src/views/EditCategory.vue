<template>
    <div class="edit-page">
        <!-- 返回按钮 -->
        <button class="back-btn" @click="goBack">
            <img :src="goBackIcon" alt="返回" class="back-icon" />
        </button>

        <!-- 标题 -->
        <header class="page-header">
            <h1 class="page-title"><span class="accent">编辑</span>分类</h1>
            <p class="subtitle">将 Topic 归入创建的 Category（单一归属）</p>
        </header>

        <div class="layout">
            <!-- 左侧：分类列表 -->
            <aside class="pane pane-left">
                <div class="pane-title">分类</div>

                <div class="new-cat">
                    <input v-model.trim="newCategoryName" class="input" type="text" placeholder="新建分类名，例如：Java"
                        @keyup.enter="addCategory" />
                    <button class="btn-primary" @click="addCategory" :disabled="!newCategoryName">添加</button>
                </div>

                <ul class="cat-list">
                    <li :class="['cat-item', { active: selectedCategory === null }]" @click="selectCategory(null)">
                        <span class="dot dot-gray"></span> 未分类
                        <small class="count">{{ uncategorized.length }}</small>
                    </li>

                    <li v-for="c in categoryList" :key="c" :class="['cat-item', { active: selectedCategory === c }]"
                        @click="selectCategory(c)">
                        <span class="dot"></span> {{ c }}
                        <small class="count">{{ countByCategory(c) }}</small>
                    </li>
                </ul>

                <div class="tips">
                    <p>提示：</p>
                    <ul>
                        <li>左侧选择分类，右侧勾选对应的 Topic。</li>
                        <li>每个 Topic 仅能属于一个分类。</li>
                        <li>点击“保存变更”将修改一次性提交。</li>
                    </ul>
                </div>
            </aside>

            <!-- 右侧：Topic 选择 -->
            <main class="pane pane-right">
                <div class="pane-title">
                    <span v-if="selectedCategory === null">未分类的 Topic</span>
                    <span v-else>“{{ selectedCategory }}” 下的 Topic</span>
                </div>

                <div class="toolbar">
                    <input v-model.trim="q" type="text" class="input" placeholder="搜索 Topic（标题/ID）" />
                    <div class="spacer"></div>
                    <button class="btn-ghost" @click="revertChanges" :disabled="!hasChanges">撤销更改</button>
                    <button class="btn-primary" @click="saveAll" :disabled="!hasChanges || saving">
                        {{ saving ? '保存中…' : '保存变更' }}
                    </button>
                </div>

                <ul class="topic-list">
                    <li v-for="t in filteredTopics" :key="t.topicId" class="topic-item">
                        <label class="row">
                            <div class="title-wrap">
                                <div class="title">{{ t.topicName }}</div>
                                <div class="meta">
                                    <span v-if="t.category" class="chip">{{ t.category }}</span>
                                    <span v-else class="chip chip-gray">未分类</span>
                                    <span class="id">#{{ t.topicId }}</span>
                                </div>
                            </div>
                            <input type="checkbox" :checked="t.category === selectedCategory"
                                @change="onToggleTopic(t)" />
                        </label>
                    </li>

                    <li v-if="filteredTopics.length === 0" class="empty">
                        没有匹配的 Topic
                    </li>
                </ul>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import goBackIcon from '@/assets/icons/goBack.svg'
import { getTopicCategories, type TopicCategoryDTO } from '@/api/topicApi'

/** 返回逻辑 */
function goBack() {
    if (history.length > 1) window.history.back()
    else window.location.href = '/'
}


/** ====== 状态 ====== */
const topics = ref<TopicCategoryDTO[]>([])
const original = ref<TopicCategoryDTO[]>([])  // 用于计算是否有改动
const selectedCategory = ref<string | null>(null) // null 代表“未分类”
const newCategoryName = ref('')
import { markCategory, type TopicCategoryMarkRequest } from '@/api/admin/topicApi'
import { toRaw } from 'vue'

const q = ref('')
const saving = ref(false)

/** ====== 加载数据（后端接入点） ======*/
const USE_MOCK = false  // 后端未就绪时可设为 true 预览
// ✅ 小工具：安全深拷贝（优先 structuredClone，失败/不支持时用 JSON）
function safeClone<T>(x: T): T {
  try {
    if (typeof structuredClone === 'function') return structuredClone(x as any)
  } catch {}
  return JSON.parse(JSON.stringify(x)) as T
}

// ✅ 小工具：把后端的 path / Topicpath 统一成 topicPath
function normalize(items: any[]): TopicCategoryDTO[] {
  return items.map(it => ({
    ...it,
    topicPath: it.topicPath ?? it.path ?? it.Topicpath ?? ''  // 统一补上 topicPath
  }))
}

async function loadTopics() {
  if (USE_MOCK) {
    const mock: TopicCategoryDTO[] = [
      { topicId: 1, topicName: '博客系统 Schema 设计', category: null },
      { topicId: 2, topicName: 'Spring Boot 文件上传优化', category: 'Java' },
      { topicId: 3, topicName: 'Grasshopper 几何布尔问题', category: 'C#' },
      { topicId: 4, topicName: 'HouseGAN 训练记录', category: 'Python' },
      { topicId: 5, topicName: '前端构建与 Docker 化', category: null },
      { topicId: 6, topicName: '（示例）去重后的另一条', category: null },
    ]
    topics.value   = mock
    original.value = safeClone(mock)
      ? structuredClone(mock)
      : JSON.parse(JSON.stringify(mock))
    return
  }

  try {
    const data = await getTopicCategories()
    const normalized = normalize(data) 
    topics.value   = normalized
    original.value = safeClone(normalized)  // ← ✅ 安全拷贝    
  } catch (err) {
    console.error('加载 topicCategories 失败:', err)
  }
}

onMounted(() => {
  void loadTopics()
})

/** ====== 分类衍生 ====== */
const categorySet = computed(() => {
    const set = new Set<string>()
    for (const t of topics.value) if (t.category) set.add(t.category)
    return set
})
const categoryList = computed(() => Array.from(categorySet.value).sort())

const uncategorized = computed(() => topics.value.filter(t => !t.category))

function countByCategory(c: string) {
    return topics.value.filter(t => t.category === c).length
}

function selectCategory(c: string | null) {
    selectedCategory.value = c
    q.value = '' // 切换分类时清空搜索
}

/** ====== 搜索过滤（当前视图） ====== */
const filteredTopics = computed(() => {
    const list = selectedCategory.value === null
        ? topics.value // 未分类视图：展示所有（可配成只看未分类，这里给你更灵活的“全量+checkbox只对当前分类生效”）
        : topics.value

    if (!q.value) {
        return selectedCategory.value === null
            ? list.filter(t => t.category === null) // 未分类视图只显示未分类
            : list
    }
    const k = q.value.toLowerCase()
    return list.filter(t =>
        (selectedCategory.value === null ? t.category === null : true) &&
        (`${t.topicName}`.toLowerCase().includes(k) || `${t.topicId}`.includes(k))
    )
})
/** ====== 勾选切换：将 TopicCategoryDTO 归入当前分类（或从该分类移除 -> 置为 null） ====== */
function onToggleTopic(t: TopicCategoryDTO) {
    if (selectedCategory.value === null) return // 未分类视图不允许勾选
    // 如果已是当前分类，则取消（置为 null）；否则设为当前分类
    t.category = (t.category === selectedCategory.value) ? null : selectedCategory.value
}

/** ====== 新增分类（字符串） ====== */
function addCategory() {
    const name = newCategoryName.value.trim()
    if (!name) return
    // 将当前选中的分类切换到新分类，方便连续归类
    selectedCategory.value = name
    newCategoryName.value = ''
}
/** ====== 变更检测 & 撤销 ====== */
const hasChanges = computed(() => {
    if (topics.value.length !== original.value.length) return true
    for (let i = 0; i < topics.value.length; i++) {
        if (topics.value[i].category !== original.value[i].category) return true
    }
    return false
})

function revertChanges() {
    topics.value = safeClone(original.value)
}

/** ====== 保存（批量提交） ====== */
async function saveAll() {
  try {
    saving.value = true

    // 计算“有变化”的项
    const changedRows = topics.value.filter((t, i) => {
      const prev = original.value[i]
      // 防御：original 可能未对齐
      if (!prev) return true
      return t.category !== prev.category
    })

    // 映射为后端需要的请求体：{ topicPath, category }
    const changes: TopicCategoryMarkRequest[] = changedRows.map(t => ({
      topicPath: String(t.topicPath),                          // 后端按 path 更新
      category: t.category && t.category.trim() !== ''    // 空串转 null
        ? t.category
        : null
    }))

    // 无改动直接返回
    if (changes.length === 0) return

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 600))
      original.value = typeof structuredClone === 'function'
        ? structuredClone(topics.value)
        : JSON.parse(JSON.stringify(topics.value))
      return
    }
    // ✅ 使用封装的 API（返回的是后端的字符串消息）
    await markCategory(changes)
    // 保存成功后同步 original
    original.value = safeClone(topics.value)

  } catch (e) {
    console.error('保存失败：', e)
    // TODO: 这里可以弹出 UI 提示
  } finally {
    saving.value = false
  }
}

</script>

<style scoped>
/* 返回按钮：与 Login.vue 金色系统一 */
.back-btn {
    position: absolute;
    top: 1.4rem;
    left: 1.6rem;
    background: none;
    border: none;
    color: #d9a669;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: color .2s;
}

.back-btn:hover {
    color: #f0c98d;
}

.back-icon {
    width: 50px;
    height: 50px;
}

/* ====== 背景（与 Projects.vue 同标准） ====== */
.edit-page {
    height: 100vh;
    padding: 6vh 2.5rem;
    background-color: #333333;
    background-image:
        repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.04) 0 2px, transparent 2px 8px),
        linear-gradient(-45deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.25));
    background-blend-mode: soft-light;
    color: #e6edf3;
    position: relative;

    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: none;
    /* 隐藏滚轮但可滚动（Firefox） */
}

.edit-page::-webkit-scrollbar {
    display: none;
}

/* 隐藏滚轮（WebKit） */

/* 标题区 */
.page-header {
    text-align: center;
    margin-bottom: 2rem;
}

.page-title {
    font-size: clamp(32px, 5vw, 50px);
    font-weight: 800;
    margin: 0;
    letter-spacing: .5px;
}

.page-title .accent {
    background: linear-gradient(180deg, #d9a669 0%, #b8833d 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 0 2px 14px rgba(185, 132, 61, .22);
}

.subtitle {
    margin-top: .6rem;
    font-size: 1rem;
    color: #b9c1c8;
}

/* 两栏布局 */
.layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 18px;
    min-height: 60vh;
}

/* 面板 */
.pane {
    background: rgba(0, 0, 0, .18);
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 14px;
    padding: 14px;
}

.pane-title {
    font-weight: 700;
    margin: 4px 2px 10px;
    color: #ffcc80;
}

/* 左侧：分类 */
/* 左侧：分类面板 */
.pane-left {
    display: flex;
    flex-direction: column;
}

/* 让分类列表自动撑开，把 tips 推到最下面 */
.cat-list {
    flex: 1 1 auto;
    /* 可伸展，占据中间剩余空间 */
    overflow-y: auto;
    /* 列表太长时可以自己滚动 */
}

/* 提示固定底部 */
.tips {
    flex-shrink: 0;
    /* 不被压缩 */
    margin-top: auto;
    /* 自动顶到底部 */
    font-size: 0.85rem;
    color: #b9c1c8;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, .08);
    /* 分隔线，精致感 */
}

/* 标题与输入框分开 */
.pane-left .pane-title {
    margin-bottom: 12px;
}

.input {
    height: 40px;
    padding: 0 .8rem;
    border-radius: 10px;
    color: #e6edf3;
    background: #2f2f2f;
    border: 1px solid rgba(255, 255, 255, .08);
    outline: none;
}

.input::placeholder {
    color: #97a3ad;
}

.input:focus {
    border-color: rgba(217, 166, 105, .7);
    box-shadow: 0 0 0 3px rgba(217, 166, 105, .18);
    background: #343434;
}


/* ===== 新建分类输入 + 按钮 ===== */
.new-cat {
    display: grid;
    grid-template-columns: 1fr max-content;
    /* 输入框占满，按钮宽度自适应 */
    align-items: center;
    gap: 10px;
    width: 100%;
    /* 保证不超出父容器 */
    margin-bottom: 12px;
    /* 与分类列表留间距 */
    box-sizing: border-box;
    /* 防止溢出 */
}

.new-cat .input {
    height: 40px;
    padding: 0 .8rem;
    border-radius: 10px;
    color: #e6edf3;
    background: #2f2f2f;
    border: 1px solid rgba(255, 255, 255, .08);
    outline: none;
    width: 100%;
    /* 输入框填满剩余空间 */
    box-sizing: border-box;
}

.new-cat .input::placeholder {
    color: #97a3ad;
}

.new-cat .input:focus {
    border-color: rgba(217, 166, 105, .7);
    box-shadow: 0 0 0 3px rgba(217, 166, 105, .18);
    background: #343434;
}

.new-cat .btn-primary {
    height: 40px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, .08);
    color: #2b241a;
    font-weight: 700;
    background: linear-gradient(180deg, #d9a669 0%, #b8833d 100%);
    box-shadow: 0 8px 20px rgba(185, 132, 61, .25);
    cursor: pointer;
    white-space: nowrap;
    position: static !important;
    /* 强制回归文档流 */
    float: none !important;
    inset: auto !important;
}

.new-cat .btn-primary:disabled {
    opacity: .6;
    cursor: not-allowed;
}


.btn-primary {
    height: 40px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, .08);
    color: #2b241a;
    font-weight: 700;
    background: linear-gradient(180deg, #d9a669 0%, #b8833d 100%);
    box-shadow: 0 8px 20px rgba(185, 132, 61, .25);
    cursor: pointer;
}

.btn-primary:disabled {
    opacity: .6;
    cursor: not-allowed;
}

.btn-ghost {
    height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px dashed rgba(217, 166, 105, .5);
    color: #e6edf3;
    background: transparent;
    cursor: pointer;
}

.btn-ghost:hover {
    background: rgba(217, 166, 105, .08);
}

.cat-list {
    list-style: none;
    margin: 8px 0 12px;
    padding: 0;
}

.cat-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 10px;
    cursor: pointer;
    color: #e6edf3;
    border: 1px solid transparent;
}

.cat-item:hover {
    background: rgba(255, 255, 255, .06);
}

.cat-item.active {
    background: rgba(217, 166, 105, .14);
    border-color: rgba(217, 166, 105, .35);
}

.count {
    color: #b9c1c8;
    font-size: .85rem;
}

.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    display: inline-block;
    background: #d9a669;
}

.dot-gray {
    background: #8a8a8a;
}

.cat-item>*:first-child {
    display: inline-flex;
    align-items: center;
}

/* 右侧：Topic 列表 */
.toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.spacer {
    flex: 1;
}

.topic-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.topic-item {
    border: 1px solid rgba(255, 255, 255, .08);
    border-radius: 12px;
    padding: 10px 12px;
    margin-bottom: 10px;
    background: rgba(0, 0, 0, .25);
}

.topic-item .row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.title-wrap {
    min-width: 0;
}

.title {
    font-weight: 600;
}

.meta {
    margin-top: 2px;
    color: #b9c1c8;
    font-size: .85rem;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(217, 166, 105, .18);
    color: #ffcc80;
    border: 1px solid rgba(217, 166, 105, .35);
}

.chip-gray {
    background: rgba(255, 255, 255, .08);
    color: #cfd6dc;
    border-color: rgba(255, 255, 255, .12);
}

.id {
    opacity: .8;
}

.empty {
    text-align: center;
    color: #9aa6af;
    padding: 24px 0;
}

.topic-list .topic-item label.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    /* 左右分布 */
    gap: 12px;
}

.topic-list .topic-item .title-wrap {
    flex: 1;
    /* 占满剩余空间，把勾选框推到最右 */
    min-width: 0;
}

.topic-list .topic-item label.row input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #d9a669;
    /* 金色勾选 */
    margin-right: 10px;
}



/* 小屏自适应 */
@media (max-width: 900px) {
    .layout {
        grid-template-columns: 1fr;
    }

    .pane-left {
        order: 2;
    }

    .pane-right {
        order: 1;
    }
}
</style>
