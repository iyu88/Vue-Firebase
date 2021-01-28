import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/board',
    name: 'board',
    component: () => import('@/views/board/index.vue')
  },
  {
    path: '/storage',
    name: 'storage',
    component: () => import('../views/storage.vue')
  },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('@/views/editor.vue')
  },
  {
    path: '/board/:info',
    name: 'board-info',
    component: () => import('@/views/board/info.vue')
  },
  {
    path: '/board/:info/:article',
    name: 'board-info-article',
    component: () => import('@/views/board/article.vue')
  },
  {
    path: '*',
    name: 'error',
    component: () => import('../views/error.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
