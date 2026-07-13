import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const userRoles = computed(() => user.value?.roles ?? [])
  const hasRole = (rol) => userRoles.value.includes(rol)

  function login(tokenValue, userData) {
    token.value = tokenValue
    user.value = userData
    localStorage.setItem('token', tokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function updateToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function updateUser(partialData) {
    user.value = { ...user.value, ...partialData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isAuthenticated, userRoles, hasRole, login, updateToken, updateUser, logout }
})