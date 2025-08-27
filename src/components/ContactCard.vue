<!-- src/components/ContactCard.vue -->
<template>
    <teleport to="body">
        <div v-if="modelValue" class="overlay" role="dialog" aria-modal="true">
            <div class="contact-card" role="document">
                <button class="close" aria-label="Close" @click="$emit('update:modelValue', false)">✕</button>

                <header class="head">
                    <div class="avatar"></div>
                    <div class="title">
                        <h3 class="name">Maiyihe</h3>
                        <p class="subtitle">Java 后端 · 全栈(Vue) · AI/深度/强化学习 · 建筑或工业软件二次开发</p>
                    </div>
                </header>

                <section class="tags">
                    <span class="chip">Java & Spring Boot 后端</span>
                    <span class="chip" >Vue 前端（兼）</span>
                    <span class="chip">Python & PyTorch</span>
                    <span class="chip">C# & Grasshopper</span>
                    <span class="chip">嵌入式设备爱好者</span>
                    <span class="chip chip-accent">研究生在读（实习求捞）</span>
                </section>

                <section class="info">
                    <div class="row"><span class="ico"></span>📧Email: myh2656377727@gmail.com</div>
                    <div class="row"><span class="ico"></span>💻GitHub: github.com/maiyihe</div>
                    <div class="row"><span class="ico"></span>💬QQ: 2656377727</div>
                    <div class="row"><span class="ico"></span>📍Location: 四川省成都市</div>
                </section>

                <footer class="copyright">
                    本博客所载文字与图片，主要记录本人日常学习（含免费教学资源）与问题解决过程。
                    如涉及版权，请联系我以便及时处理或删除。
                </footer>
            </div>
        </div>
    </teleport>
</template>

<script setup>
  defineProps({ modelValue: Boolean })
  </script>

<!-- 全局变量（不加 scoped，避免 teleport 取不到） -->
<style>
:root {
    --bg: #1b1c1d;
    --card: #232425;
    --text: #e7e7e7;
    --muted: #a9a9a9;
    --chip: hsl(210 16% 24%);
    --chip-text: #f5f5f5;
    --chip-accent: hsla(34, 67%, 57%, 0.671);
    --ring: #2e2f31;
    --radius: 14px;
    --space: 14px;
}
</style>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .6);
    display: grid;
    place-items: center;
    z-index: 2000;
}

.contact-card {
    position: relative;
    background: var(--card);
    color: var(--text);
    border-radius: var(--radius);
    padding: 22px 22px 18px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, .35);
    border: 1px solid var(--ring);
    max-width: 640px;
    width: min(92vw, 640px);
    margin: 0 auto;
}

.close {
    position: absolute;
    top: 10px;
    right: 12px;
    background: transparent;
    border: 0;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
}

.head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--space);
}

.avatar {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #333 url('@/assets/icons/touxiang.png') center/cover no-repeat;
}

.title .name {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: .3px;
}

.subtitle {
    margin: 2px 0 0;
    color: var(--muted);
    font-size: 13px;
}

.tags {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 10px 0 14px;
}

.chip {
    display: inline-block;
    text-align: center;
    padding: 8px 10px;
    border-radius: 999px;
    background: var(--chip);
    color: var(--chip-text);
    font-size: 13px;
    line-height: 1;
    border: 1px solid rgba(255, 255, 255, .06);
}

.chip-accent {
    background: var(--chip-accent);
}

.info {
    display: grid;
    grid-template-columns: repeat(2, auto);
    justify-content: center;
    gap: 6px 28px;
    padding: 10px 14px;
    background: #1e1f20;
    border-radius: 12px;
    border: 1px solid var(--ring);
    margin-bottom: 12px;
    font-size: 13px;
}

.info .row {
    text-align: left;
    white-space: nowrap;
}

.info .ico {
    margin-right: 6px;
    opacity: .85;
}

.copyright {
    margin-top: 6px;
    font-size: 12px;
    color: var(--muted);
    text-align: left;
    line-height: 1.45;
}
</style>