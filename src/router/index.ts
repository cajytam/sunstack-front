import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from '~pages'

import { useUserStore } from '@/stores/user'

const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  routes,
  history: createWebHistory(import.meta.env.BASE_URL),
})

router.beforeEach(async to => {
  const userStore = useUserStore()
  if (userStore.user === null) await userStore.getUser()

  if (userStore.user === null && to.name !== 'auth-login' && to.name !== 'auth-reset-password-token') {
    return {
      name: 'auth-login',
      query: { redirect: to.fullPath },
    }
  }

  // si utilisateur déjà authentifié et qui se dirige vers la page de connexion
  if (to.name === 'auth-login' && userStore.user !== null)
    return {
      name: 'dashboard',
    }

  if (to.path === '/')
    return {
      name: 'dashboard',
    }
})

export default router
