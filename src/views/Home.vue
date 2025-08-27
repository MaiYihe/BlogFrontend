<template>
    <section class="home-container">
        <div class="welcome-box">
            <h1 class="title">
                Welcome to <span class="highlight">Maiyihe</span> Blog
            </h1>
            <p class="subtitle">一个记录思考、分享知识与探索世界的空间</p>

            <el-divider content-position="center">About This Blog</el-divider>

            <p class="paragraph">
                本博客致力于分享编程语言与框架、操作系统与网络、机器/深度学习研究等多元主题。知识的力量在于传播，每一篇文章都是一次思考的沉淀与成长的脚印。
            </p>
            <p class="paragraph">
                无论你是开发者，还是好奇心驱动的探索者，愿你在这里发现灵感，收获价值。
            </p>

            <el-divider content-position="center">Stay Curious, Keep Learning</el-divider>
            <!-- 已移除「开始阅读」按钮 -->
        </div>
    </section>
</template>

<script setup>
// 使用 Element Plus 的 <el-divider>
</script>

<style scoped>
.home-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6vh 2rem;
    min-height: 90vh;
    max-width: 150vh;
    color: var(--text);
    font-family: 'Segoe UI', 'Helvetica Neue', ui-sans-serif, system-ui, -apple-system, sans-serif;
    margin: 0 auto;
    /* ⬅ 水平居中关键 */
}

.welcome-box {
    position: relative;
    max-width: 760px;
    background: rgba(255, 255, 255, 0.04);
    padding: 2.8rem 2.6rem;
    border-radius: 20px;
    backdrop-filter: blur(12px);
    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.45),
        inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    text-align: center;
    transition: transform .25s ease, box-shadow .25s ease;

    /* 渐变描边光晕 */
    outline: 1px solid rgba(255, 255, 255, 0.06);
}

.welcome-box::before {
    /* 顶部细渐变条，提升质感 */
    content: "";
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 2px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    filter: drop-shadow(0 0 6px var(--accent-weak));
}

.welcome-box:hover {
    transform: translateY(-2px);
    box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.5),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.title {
    font-size: 2.6rem;
    line-height: 1.15;
    font-weight: 650;
    letter-spacing: 0.2px;
    color: #ffffff;
    margin-bottom: 0.75rem;
}


.subtitle {
    font-size: 1.1rem;
    color: var(--text-muted);
    margin-bottom: 2rem;
    opacity: 0.95;
}

.paragraph {
    font-size: 1.06rem;
    line-height: 1.85;
    margin-bottom: 1.4rem;
    color: #dedede;
    text-align: justify;
}

/* Divider 文案橙色点缀 */
:deep(.el-divider) {
    border-top-color: rgba(255, 255, 255, 0.08);
}

:deep(.el-divider__text) {
    background-color: var(--bg);
    color: var(--accent);
    font-weight: 560;
    font-size: 0.96rem;
    padding: 0 0.9em;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--accent-weak), 0 0 14px var(--accent-weak-2);
}

.highlight {
    position: relative;
    color: #ffb86bbb !important;
    /* 橙色字体 */
    background-image: linear-gradient(180deg, transparent 65%, rgba(255, 184, 107, 0.18) 0);
    padding: 0 .12em;
    border-radius: 6px;
    text-shadow: 0 0 12px rgba(255, 184, 107, 0.25);
}

:deep(.el-divider__text) {
    background-color: #2b2b2b !important;
    /* 背景依旧深色 */
    color: #ffb86bbb !important;
    /* 橙色文字 */
    font-weight: 560;
    font-size: 0.96rem;
    padding: 0 0.9em;
    border-radius: 8px;
    box-shadow: 0 0 0 1px rgba(255, 184, 107, 0.18),
        0 0 14px rgba(255, 184, 107, 0.08);
}
</style>
