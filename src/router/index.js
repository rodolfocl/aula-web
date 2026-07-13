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
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { public: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: { name: 'Inicio' },
      },
      {
        path: 'inicio',
        name: 'Inicio',
        component: () => import('../views/InicioView.vue'),
      },
      {
        path: 'alumno/historial',
        name: 'AlumnoHistorial',
        component: () => import('../views/alumno/DashboardAlumno.vue'),
        meta: { rol: 'alumno' },
      },
      {
        path: 'profesor/sesion',
        name: 'ProfesorSesion',
        component: () => import('../views/profesor/DashboardProfesor.vue'),
        meta: { roles: ['profesor', 'administrador'] },
      },
      {
        path: 'profesor/curso/:id/asistencia',
        name: 'PasarAsistencia',
        component: () => import('../views/profesor/PasarAsistencia.vue'),
        meta: { roles: ['profesor', 'administrador'] },
      },
      {
        path: 'profesor/curso/:id/notas',
        name: 'RegistrarNotas',
        component: () => import('../views/profesor/RegistrarNotas.vue'),
        meta: { roles: ['profesor', 'administrador'] },
      },
      {
        path: 'admin/usuarios',
        name: 'AdminUsuarios',
        component: () => import('../views/admin/AdminUsuarios.vue'),
        meta: { roles: ['administrador', 'profesor'] },
      },
      {
        path: 'admin/cursos',
        name: 'AdminCursos',
        component: () => import('../views/admin/AdminCursos.vue'),
        meta: { roles: ['administrador', 'profesor'] },
      },
      {
        path: 'calendario',
        name: 'Calendario',
        component: () => import('../views/CalendarioView.vue'),
        meta: { roles: ['administrador', 'profesor'] },
      },
      {
        path: 'archivos',
        name: 'Archivos',
        component: () => import('../views/ArchivosView.vue'),
        meta: { roles: ['administrador', 'profesor'] },
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

  if (to.meta.rol && !auth.hasRole(to.meta.rol)) return { name: 'Login' }
  if (to.meta.roles && !to.meta.roles.some(r => auth.hasRole(r))) return { name: 'Login' }

  return true
})

export default router