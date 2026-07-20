import { computed } from 'vue'
import { useAuthStore } from '../stores/authStore'

export function usePermissions() {
  const auth = useAuthStore()
  const isAdmin   = computed(() => auth.hasRole('administrador') || auth.hasRole('profesor'))
  const isTeacher = computed(() => auth.hasRole('profesor'))
  const isStudent = computed(() => auth.hasRole('alumno'))
  return { isAdmin, isTeacher, isStudent }
}