import axios from 'axios'
import { Notify } from 'quasar'
import router from '../router'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  const route = router.currentRoute.value.fullPath
  if (route && route !== '/') {
    config.headers['X-Client-Route'] = route
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    const renewedToken = response.headers['x-renewed-token']
    if (renewedToken) {
      const auth = useAuthStore()
      auth.updateToken(renewedToken)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      const wasAuthenticated = auth.isAuthenticated
      auth.logout()
      router.push({ name: 'Login' })
      if (wasAuthenticated) {
        Notify.create({
          type: 'warning',
          message: 'Tu sesión expiró por inactividad. Vuelve a iniciar sesión.',
          position: 'top',
          timeout: 5000,
        })
      }
    }
    return Promise.reject(error)
  }
)

export default api