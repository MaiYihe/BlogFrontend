<template>
  <div class="tree-node">
    <div class="node-row">
      <!-- 文件夹行 -->
      <template v-if="node.folder === true">
        <el-tooltip
          content="内容不可见"
          placement="right"
          :disabled="!disabled"
          :show-after="100"
        >
          <div
            class="node-label folder-item"
            :class="{ disabled }"
            :aria-disabled="disabled"
            :tabindex="disabled ? -1 : 0"
            @click="onFolderClick"
          >
            <!-- 判断虚拟分组节点，用不同图标 -->
            <template v-if="node.isCategoryGroup">
              <img :src="categoryIcon" alt="category" class="iconC" />
            </template>
            <template v-else>
              <span>{{ expanded ? "▾" : "▸" }}</span>
            </template>

            <!-- 文件夹名字 -->
            <span v-if="parsedName.prefix" class="name-prefix">
              {{ parsedName.prefix }}
            </span>
            <span class="name-rest">
              {{ parsedName.rest }}
            </span>
          </div>
        </el-tooltip>
      </template>

      <!-- 文件行 -->
      <template v-else>
        <el-tooltip
          content="内容不可见"
          placement="right"
          :disabled="!disabled"
          :show-after="100"
        >
          <!-- 可见：正常跳转 -->
          <router-link
            v-if="!disabled"
            class="node-label link-like"
            :to="{ name: 'content', query: { notePath: node.currentPath } }"
          >
            <span class="icon">●</span>

            <!-- 文件名字 -->
            <span v-if="parsedName.prefix" class="name-prefix">
              {{ parsedName.prefix }}
            </span>
            <span class="name-rest">
              {{ parsedName.rest }}
            </span>
          </router-link>

          <!-- 不可见：禁用占位，完全阻断路由 -->
          <span
            v-else
            class="node-label link-like disabled"
            aria-disabled="true"
            tabindex="-1"
          >
            <span class="icon">●</span>

            <!-- 文件名字 -->
            <span v-if="parsedName.prefix" class="name-prefix">
              {{ parsedName.prefix }}
            </span>
            <span class="name-rest">
              {{ parsedName.rest }}
            </span>
          </span>
        </el-tooltip>
      </template>

      <!-- 行尾可见性按钮（仅标记模式下显示；虚拟分组不显示） -->
      <span v-if="props.isMarkingA && !node.isCategoryGroup" class="lock-icon">
        <button
          class="icon_btn"
          :aria-pressed="!!node.visible"
          :title="node.visible ? '点击设为不可见' : '点击设为可见'"
          @click.stop="onToggleVisible"
          @keydown.enter.prevent="onToggleVisible"
          @keydown.space.prevent="onToggleVisible"
        >
          <img
            :src="node.visible ? visibilityOnIcon : visibilityOffIcon"
            :alt="node.visible ? '可见' : '不可见'"
            class="icon_visibility"
            :class="node.visible ? 'is-on' : 'is-off'"
          />
        </button>
      </span>
    </div>

    <!-- 子节点递归渲染 -->
    <div
      class="node-children"
      v-if="expanded && node.children && node.children.length > 0"
    >
      <SideBarTreeNode
        v-for="child in sortedChildren"
        :key="keyOf(child)"
        :node="child"
        :toggleExpand="props.toggleExpand"
        :isExpanded="props.isExpanded"
        :isMarkingA="props.isMarkingA"
        @toggle-visible="emit('toggle-visible', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SideBarTreeNode from "./SideBarTreeNode.vue";
import visibilityOnIcon from "@/assets/icons/visibility_on.svg";
import visibilityOffIcon from "@/assets/icons/visibility_off.svg";
import type { TreeNode } from "@/utils/treeNodes";
import categoryIcon from "@/assets/icons/category.svg";

const props = defineProps<{
  node: TreeNode;
  // 不再要求 expandedMap，改为只接受“查询/切换”两个回调
  toggleExpand: (key: string) => void;
  isExpanded: (key: string) => boolean;
  isMarkingA: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-visible", payload: { key: string; nextVisible: boolean }): void;
}>();

// 统一生成稳定 key
const keyOf = (n: TreeNode): string =>
  n.id ?? n.currentPath ?? `virtual:${n.name}`;

// 是否禁用（不可见即禁用）
const disabled = computed(() => props.node.visible === false);

// 展开态（通过父回调/Pinia 查询）
const expanded = computed(() => props.isExpanded(keyOf(props.node)));

// 文件夹点击：禁用时不响应；其余交给父回调/Pinia 切换
const onFolderClick = () => {
  if (disabled.value) return;
  if (props.node.folder) props.toggleExpand(keyOf(props.node));
};

// 切换可见性：上抛给父去处理数据
const onToggleVisible = () => {
  const key = keyOf(props.node);
  const cur = props.node.visible === true;
  emit("toggle-visible", { key, nextVisible: !cur });
};

// 首字母排序
type LeadKind = "number" | "letter" | "han" | "other";

/** 提取“前导数字序列”：例如 "-2.10.3 xxx" → [-2, 10, 3]；没有则返回 null */
function extractNumberSeq(name: string): number[] | null {
  const s = (name ?? "").trim();
  const m = s.match(/^-?\d+(?:\.\d+)*/)?.[0]; // 仅匹配前导的 数字[.数字]*
  if (!m) return null;
  return m.split(".").map((n) => Number(n)); // 支持负数、0、正数
}

/** 判断名字的“前导字符类别” */
function leadKind(name: string): LeadKind {
  const s = (name ?? "").trim();
  if (!s) return "other";
  if (extractNumberSeq(s)) return "number";
  const ch = s.codePointAt(0)!;
  // A-Z / a-z
  if ((ch >= 0x41 && ch <= 0x5a) || (ch >= 0x61 && ch <= 0x7a)) return "letter";
  // 汉字（基本区 + 常见扩展 A~F 的一部分；如需更广可再加）
  if ((ch >= 0x4e00 && ch <= 0x9fff) || (ch >= 0x3400 && ch <= 0x4dbf))
    return "han";
  return "other";
}

/** 类别优先级：数字(0) < 字母(1) < 汉字(2) < 其它(3) */
function kindWeight(k: LeadKind): number {
  switch (k) {
    case "number":
      return 0;
    case "letter":
      return 1;
    case "han":
      return 2;
    default:
      return 3;
  }
}

/** 多级数字序列的比较：按位比较，短者优先（如 2.3 < 2.3.1） */
function compareNumberSeq(a: number[], b: number[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined) return -1;
    if (bi === undefined) return 1;
    if (ai !== bi) return ai - bi; // 支持负数：-3 < -2 < -1 < 0 < 1...
  }
  return 0;
}

/** ASCII/码点顺序比较（不做本地化；严格按码点） */
function compareByCodePoint(a: string, b: string): number {
  const sa = (a ?? "").trim();
  const sb = (b ?? "").trim();
  let i = 0,
    j = 0;
  while (i < sa.length && j < sb.length) {
    const ca = sa.codePointAt(i)!;
    const cb = sb.codePointAt(j)!;
    if (ca !== cb) return ca - cb;
    i += ca > 0xffff ? 2 : 1;
    j += cb > 0xffff ? 2 : 1;
  }
  return sa.length - sb.length;
}

// ========== 节点排序 ==========

/** 文件夹在前（可选：虚拟分组最前）；再按开头类别优先级；再按同类规则排序 */
function nodeWeight(n: TreeNode): number {
  // 如需把“虚拟分组”顶到最前，取消下一行注释并让它返回 -1
  // if (n.isCategoryGroup) return -1
  return n.folder ? 0 : 1; // 规则1：先文件夹(0)，再文件(1)
}

function compareSiblings(a: TreeNode, b: TreeNode): number {
  // 1) 文件夹优先
  const w = nodeWeight(a) - nodeWeight(b);
  if (w !== 0) return w;

  // 2) 按前导类别排序：数字 < 字母 < 汉字 < 其它
  const ka = leadKind(a.name),
    kb = leadKind(b.name);
  const kw = kindWeight(ka) - kindWeight(kb);
  if (kw !== 0) return kw;

  // 3) 同类内部排序
  if (ka === "number") {
    const na = extractNumberSeq(a.name)!;
    const nb = extractNumberSeq(b.name)!;
    const ndiff = compareNumberSeq(na, nb);
    if (ndiff !== 0) return ndiff;
    // 数字部分完全相同，再比“余下文本”（去掉前导数字串）以稳定顺序
    const ra = (a.name ?? "").trim().slice(na.join(".").length).trim();
    const rb = (b.name ?? "").trim().slice(nb.join(".").length).trim();
    const tail = compareByCodePoint(ra, rb);
    if (tail !== 0) return tail;
  }

  // 字母开头、汉字开头、其它：都按码点（ASCII/Unicode）比较
  return compareByCodePoint(a.name, b.name);
}

/** 当前层 children 的排序视图（不原地变异） */
const sortedChildren = computed<TreeNode[]>(() => {
  const kids = props.node.children ?? [];
  return [...kids].sort(compareSiblings);
});

// 数字前缀与后缀分离（`_` 来区分）
const parsedName = computed(() => {
  const name = props.node.name ?? "";
  const idx = name.indexOf("_");

  // 不符合 A_B 格式
  if (idx <= 0) {
    return { prefix: null as string | null, rest: name };
  }

  const prefix = name.slice(0, idx);
  const rest = name.slice(idx + 1);

  // 支持：负号 + 数字（-?\d+）
  if (!/^-?\d+(?:\.\d+)*$/.test(prefix)) {
    return { prefix: null as string | null, rest: name };
  }

  return { prefix, rest };
});
</script>

<style scoped>
.tree-node {
  /* margin-left: 0.5rem; */
  margin-bottom: 0.2rem;
  width: 100%;
}

/* 蒙版状态下每一项加锁 */
.node-row {
  position: relative;
  /* 让这一行成为定位参照 */
  /* 如果行高不固定，建议给个最小高度 */
  min-height: 24px;
}

.lock-icon {
  position: absolute;
  right: 10px;
  top: 60%;
  transform: translateY(-50%);
  /* pointer-events: none;   ← 删除这行 */
  pointer-events: auto;
  /* ← 改为可交互 */
  z-index: 1000;
}

.node-children {
  margin-left: 1rem;
}

.link-like {
  display: flex;
  /* 让图标和文字并排 */
  align-items: center;
  gap: 1px;
  /* 图标与文字间距 */
  width: 100%;
  /* 占满整行 */
  box-sizing: border-box;
  /* 包含内边距在宽度内 */
  color: inherit;
  text-decoration: none;
}

/* ② 仅非禁用时允许 hover 变色 —— 用它替代上面的两段 */
.node-label:not(.disabled):hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #f5a742;
}

.link-like:not(.disabled):hover {
  text-decoration: none;
  color: #f5a742;
}

/* ③ 禁用态基础样式（保持灰色） */
.node-label.disabled,
.link-like.disabled {
  color: #9aa0a6;
  cursor: not-allowed;
}

/* ④ 禁用态 hover：显式保持灰色，且必要时加 !important 兜底 */
.node-label.disabled:hover,
.link-like.disabled:hover {
  background: transparent !important;
  color: #9aa0a6 !important;
  /* ← 不要用 inherit，否则会继承父级而不是本色 */
}

/* 仅文件夹行显示手型并做个悬停高亮 */
.folder-item {
  cursor: pointer;
}

.icon_btn {
  border: none;
  background: transparent;
  padding: 0;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.icon_btn:focus-visible {
  outline: 2px solid #3b82f6;
  /* 可换主题色 */
  outline-offset: 2px;
  border-radius: 6px;
}

.icon_visibility {
  width: 16px;
  /* 自行调整大小 */
  height: 16px;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;
  vertical-align: middle;
}

/* 悬停/聚焦时“变亮” + 微缩放 */
.icon_btn:hover .icon_visibility,
.icon_btn:focus-visible .icon_visibility {
  filter: brightness(1.2);
  transform: scale(1.06);
}

.icon_visibility.is-off {
  filter: brightness(0) saturate(60%) invert(10%) sepia(65%) saturate(7470%)
    hue-rotate(2deg) brightness(96%) contrast(114%);
}

/* ① 禁用态：置灰 + 禁用光标（文件/文件夹通用） */
.node-label.disabled {
  color: #9aa0a6;
  /* 文字置灰，可按主题调整 */
  cursor: not-allowed;
}

/* 图标也稍微降亮度（可选） */
.node-label.disabled .icon,
.node-label.disabled .icon_visibility {
  opacity: 0.6;
}

/* 禁用时不出现 hover 高亮 */
.node-label.disabled:hover {
  background: transparent !important;
  color: inherit;
  /* 保持置灰，不变色 */
}

/* 如果 link-like 在你项目里有下划线/高亮，禁用态去掉 */
.link-like.disabled {
  text-decoration: none;
}

/* ② Hover 只对“非禁用”生效（替换你原来的 .node-label:hover） */
.node-label:not(.disabled):hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: #f5a742;
}

/* link 的 hover 同理（替换你原来的 .link-like:hover） */
.link-like:not(.disabled):hover {
  text-decoration: none;
  color: #f5a742;
}

/* ③ 文件夹行：只有非禁用才显示手型 */
.folder-item {
  cursor: default;
}

.folder-item:not(.disabled) {
  cursor: pointer;
}


/* 锁图标仍可交互（你已设置 pointer-events:auto; 很好） */
.lock-icon {
  position: absolute;
  right: 10px;
  top: 60%;
  transform: translateY(-50%);
  pointer-events: auto;
  z-index: 1000;
}

.iconC {
  width: 20px;
  height: 20px;
  margin-left: 4px;
  margin-right: 0px;
  margin-bottom: 2px;
  vertical-align: middle;
}

/* 文件面前的小圆点 */
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2px;        /* 控制占位宽度 */
  height: 14px;       /* 控制垂直居中 */
  margin-right: 8px;
  font-size: 14px;    /* 控制圆点大小 */
  line-height: 1;     /* 避免字体行高干扰 */
  color: rgba(255, 255, 255, 0.85);
  flex-shrink: 0;
}

/* 文件数字前缀 */
.name-prefix {
  color: #ffb86b;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-right: 0.25em;
}
.name-prefix.negative {
  color: #ffb86b;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  margin-right: 0.25em;
}
/* disabled 时 prefix 降权 */
.node-label.disabled .name-prefix,
.node-label.disabled .name-prefix.negative {
  color: rgba(255, 184, 107, 0.45);
}
</style>

