import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import ChatView from '../views/ChatView.vue'
import AdminUploadView from '../views/AdminUploadView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView
    },
    {
      path: '/admin/upload',
      name: 'admin-upload',
      component: AdminUploadView
    }
  ]
})

let isInitialLoad = true

router.beforeEach((to, from, next) => {
  if (isInitialLoad) {
    isInitialLoad = false
    if (to.path !== '/' && to.path !== '/admin/upload') {
      return next('/')
    }
  }
  next()
})

export default router
