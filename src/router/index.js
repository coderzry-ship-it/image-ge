import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'batch',
    component: () => import('../views/BatchGenerate.vue'),
    meta: { title: '批量生图' },
  },
  {
    path: '/single',
    name: 'single',
    component: () => import('../views/SingleGenerate.vue'),
    meta: { title: '单张漫画' },
  },
  {
    path: '/free',
    name: 'free',
    component: () => import('../views/FreeGenerate.vue'),
    meta: { title: '自由生图' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
