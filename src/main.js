import { createApp } from 'vue'
import './style.css'
// 把 ./App.vue 文件默认导出的组件，绑定到变量 App 上
import App from './App.vue'
// 引入样式
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' 
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

app.use(router)
.use(ElementPlus)
.use(createPinia())

// 初始化鉴权（有 jwt 则验证，无则 guest）
const auth = useAuthStore()
await auth.initAuth()

app.mount('#app')