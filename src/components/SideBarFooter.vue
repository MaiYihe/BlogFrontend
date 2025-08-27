<template>
  <div class="sidebar-footer">

    <div class="left-box">
      <el-dropdown @command="onChoose" trigger="click" placement="top-start">
        <!-- 按钮里显示“当前选项对应的字母” -->
        <button class="avatar">{{ avatarLetter }}</button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="group-category">Group by Category</el-dropdown-item>
            <el-dropdown-item command="alpha">Sort A–Z</el-dropdown-item>
            <el-dropdown-item command="popular">Sort by Popularity</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <div class="mode">
        <div class="modeName">{{ label }}</div>
      </div>
    </div>

    <!-- 设置按钮 -->
    <el-tooltip :content="tooltipText" placement="right">
      <img class="settings-icon" :class="{ uploadMode: isUpload }" :src="iconSrc" alt="Settings" @click="onIconClick" />
    </el-tooltip>
  </div>

  <!-- 确认弹窗 -->
  <el-dialog v-model="showConfirm" title="确认操作" width="420px" :show-close="false" modal modal-class="dim-mask"
    append-to-body>
    <div>确定要上传笔记可见性吗？</div>
    <template #footer>
      <el-button @click="onCancel">取消</el-button>
      <el-button type="primary" @click="onConfirm">确认</el-button>
    </template>
  </el-dialog>

</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import settingsIcon from '@/assets/icons/settings.svg'
import uploadIcon from '@/assets/icons/upload-cloud-line.svg'

const OPTION_MAP = {
  'group-category': { label: 'Group by Category', letter: 'C' },
  'alpha': { label: 'Sort A–Z', letter: 'A' },
  'popular': { label: 'Sort by Popularity', letter: 'P' },
} as const
type Command = keyof typeof OPTION_MAP

// 本地状态：当前选项
const currentCommand = ref<Command>('group-category')

// emits：两个事件都声明
const emit = defineEmits<{
  (e: 'change-mode', mode: Command): void
  (e: 'update:modelValue', v: boolean): void
  (e: 'update:open', v: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

// 下拉选择：本地更新 + 通知父组件
function onChoose(cmd: Command) {
  currentCommand.value = cmd
  emit('change-mode', cmd)
}

// 派生显示
const currentLabel = computed(() => OPTION_MAP[currentCommand.value].label)
const avatarLetter = computed(() => OPTION_MAP[currentCommand.value].letter)
const label = currentLabel

// v-model 处理
const props = defineProps<{ modelValue: boolean, open: boolean}>()
const isUpload = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})
const iconSrc = computed(() => isUpload.value ? uploadIcon : settingsIcon)
const tooltipText = computed(() => isUpload.value ? '上传笔记可见性' : '编辑笔记可见性')

function onIconClick() {
  isUpload.value ? showConfirm.value = true : (isUpload.value = true)
}

// 受控开关桥接到 el-dialog
const showConfirm = computed({
  get: () => props.open,
  set: v => emit('update:open', v)
})

function onCancel() {
  // ✅ 本地处理
  showConfirm.value = false
  // ✅ 同时通知父组件
  emit('cancel')
}
function onConfirm() {
  try {
    // ✅ 本地处理（保留你的逻辑）
    isUpload.value = false
  } finally {
    showConfirm.value = false
  }
  // ✅ 同时通知父组件
  emit('confirm')
}

</script>

<style scoped>
/* 背景栏 */
.sidebar-footer {
  display: flex;
  justify-content: space-between;
  /* 左右对齐 */
  align-items: center;
  /* 垂直居中 */
  padding: 1rem;
  background-color: #222;
  position: sticky;
  bottom: 0;
  width: 100%;
}

.left-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 2rem;
  height: 2rem;
  background-color: rgba(238, 182, 98, 0.767);
  color: rgb(221, 221, 221);
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modeName {
  font-size: 0.9rem;
}

/* 设置图标动画 */
.settings-icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
  filter: invert(1);
  /* 黑变白 */

  /* 关键动画设置 */
  transition: transform 0.5s ease;
  transform-origin: center center;
}

.settings-icon:hover {
  transform: rotate(180deg);
  /* 或者 360deg 转一整圈 */
}

/* upload 模式下 hover 缩放 */
.settings-icon.uploadMode:hover {
  transform: scale(1.2);
}
</style>
