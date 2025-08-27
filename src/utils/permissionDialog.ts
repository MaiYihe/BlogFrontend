// src/utils/permissionDialog.ts
import { ElMessageBox } from 'element-plus'

let showing = false

export async function showPermissionDialog(message = '没有权限，请联系管理员') {
  if (showing) return
  showing = true
  try {
    await ElMessageBox.alert(message, '权限提示', {
      confirmButtonText: '我知道了',
      type: 'warning',
      closeOnPressEscape: true,
      closeOnClickModal: true,
      customClass: 'dark-box'
    })
  } finally {
    showing = false
  }
}