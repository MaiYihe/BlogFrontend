// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/Layout.vue'),
      children: [
        { path: '', name: 'Home', component: () => import('@/views/Home.vue') },

        {
          path: 'content',
          name: 'content',
          component: () => import('@/views/Note.vue'),
          // 把 query 里的 notePath 作为 prop 传入
          props: route => ({ notePath: route.query.notePath || '' }),
        },
      ],
    },

    { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
    { path: '/Projects', name: 'Project', component: () => import('@/views/Projects.vue') },
    { path: '/EditCategory', name: 'EditCategory', component: () => import('@/views/EditCategory.vue') },

    // 可选：404
    // { path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFound.vue') },
  ],
})