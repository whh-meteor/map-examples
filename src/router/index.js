import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DemoDetail from '../views/DemoDetail.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/demo/:id',
    name: 'DemoDetail',
    component: DemoDetail,
    props: true
  },
  {
    path: '/demo/:id/edit',
    name: 'DemoEdit',
    component: DemoDetail,
    props: { route: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
