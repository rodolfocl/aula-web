import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: () => {
          const auth = useAuthStore()
          const rol = auth.userRole
          if (rol === 'alumno') return '/alumno/dashboard'
          if (rol === 'profesor') return '/profesor/dashboard'
          if (rol === 'admin') return '/admin/usuarios'
          return '/login'
        },
      },
      // Rutas alumno
      {
        path: 'alumno/dashboard',
        name: 'AlumnoDashboard',
        component: () => import('../views/alumno/DashboardAlumno.vue'),
        meta: { rol: 'alumno' },
      },
      // Rutas profesor
      {
        path: 'profesor/dashboard',
        name: 'ProfesorDashboard',
        component: () => import('../views/profesor/DashboardProfesor.vue'),
        meta: { rol: 'profesor' },
      },
      {
        path: 'profesor/curso/:id/asistencia',
        name: 'PasarAsistencia',
        component: () => import('../views/profesor/PasarAsistencia.vue'),
        meta: { rol: 'profesor' },
      },
      // Rutas admin
      {
        path: 'admin/usuarios',
        name: 'AdminUsuarios',
        component: () => import('../views/admin/AdminUsuarios.vue'),
        meta: { rol: 'admin' },
      },
      {
        path: 'admin/cursos',
        name: 'AdminCursos',
        component: () => import('../views/admin/AdminCursos.vue'),
        meta: { rol: 'admin' },
      },
      {
        path: 'admin/instancias',
        name: 'AdminInstancias',
        component: () => import('../views/admin/AdminInstancias.vue'),
        meta: { rol: 'admin' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) return true

  if (!auth.isAuthenticated) return { name: 'Login' }

  if (to.meta.rol && auth.userRole !== to.meta.rol) {
    return { name: 'Login' }
  }

  return true
})

export default router