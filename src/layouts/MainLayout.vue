<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ── TOPBAR ─────────────────────────────────────── -->
    <q-header style="background: #FFFFFF; box-shadow: var(--pdv-shadow-topbar); min-height: 64px;">
      <q-toolbar style="min-height: 64px; padding: 0 16px 0 8px;">

        <!-- Hamburger — solo en mobile -->
        <q-btn
          v-if="$q.screen.lt.md"
          flat round dense icon="menu"
          color="grey-7" class="q-mr-xs"
          @click="drawer = !drawer"
        />

        <!-- Logo -->
        <q-toolbar-title shrink style="min-width: 0; padding: 0 12px 0 4px;">
          <img :src="logoImg" alt="Aula PDV"
            style="height: 46px; width: auto; object-fit: contain; display: block;" />
        </q-toolbar-title>

        <q-space />

        <!-- Derecha: notificaciones + usuario + logout -->
        <div class="row items-center no-wrap" style="gap: 4px;">

          <q-btn flat round dense icon="notifications_none" color="grey-6" size="sm">
            <q-tooltip class="pdv-tooltip" anchor="bottom middle" self="top middle">Notificaciones</q-tooltip>
          </q-btn>

          <!-- Info usuario — oculta en xs -->
          <div class="gt-xs row items-center no-wrap" style="gap: 10px; padding: 0 6px;">
            <div class="column items-end" style="gap: 2px;">
              <span style="
                color: #1E293B; font-size: 13px; font-weight: 600; line-height: 1.2;
                max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
              ">
                {{ auth.user?.full_name ?? auth.user?.nombre }}
              </span>
              <div class="row items-center" style="gap: 4px;">
                <template v-if="esAdmin">
                  <span class="pdv-pill pdv-pill-navy" style="font-size: 10px; padding: 2px 7px;">
                    Administrador
                  </span>
                </template>
                <template v-else>
                  <span
                    v-for="rol in auth.userRoles" :key="rol"
                    class="pdv-pill"
                    style="background: rgba(13,27,62,0.06); color: #475569; font-size: 10px; padding: 2px 7px;"
                  >{{ rol }}</span>
                </template>
              </div>
            </div>
            <div class="pdv-avatar pdv-avatar-md topbar-avatar">
              {{ iniciales(auth.user?.full_name ?? auth.user?.nombre ?? '?') }}
            </div>
          </div>

          <!-- Avatar solo en xs -->
          <div class="lt-sm pdv-avatar pdv-avatar-md topbar-avatar" style="margin: 0 4px;">
            {{ iniciales(auth.user?.full_name ?? auth.user?.nombre ?? '?') }}
          </div>

          <q-btn flat round dense icon="logout" color="grey-7" size="sm" @click="cerrarSesion">
            <q-tooltip class="pdv-tooltip" anchor="bottom middle" self="top middle">Cerrar sesión</q-tooltip>
          </q-btn>
        </div>

      </q-toolbar>
    </q-header>

    <!-- ── SIDEBAR ─────────────────────────────────────── -->
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="64"
      style="background: #0B1835;"
    >
      <div class="column items-center" style="padding-top: 64px; height: 100%;">
        <div class="sidebar-divider" style="margin-top: 12px; margin-bottom: 8px;" />

        <div class="column items-center" style="width: 64px; gap: 2px;">

          <template v-if="auth.hasRole('alumno')">
            <q-item
              clickable v-ripple
              :to="{ name: 'AlumnoHistorial' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AlumnoHistorial') }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-history"
                :style="`font-size: 22px; color: ${isActive('AlumnoHistorial') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Mi Historial
              </q-tooltip>
            </q-item>
          </template>

          <div class="sidebar-divider" />

          <template v-if="auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'ProfesorSesion' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isProfesorActive }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-chalkboard"
                :style="`font-size: 22px; color: ${isProfesorActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Mis Clases
              </q-tooltip>
            </q-item>
          </template>

          <div
            v-if="(auth.hasRole('administrador') || auth.hasRole('profesor')) && auth.hasRole('alumno')"
            class="sidebar-divider"
          />

          <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'AdminUsuarios' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminUsuarios') }"
              @click="cerrarDrawerMobile"
            >
              <q-icon name="people" size="22px"
                :style="{ color: isActive('AdminUsuarios') ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Usuarios
              </q-tooltip>
            </q-item>

            <q-item
              clickable v-ripple
              :to="{ name: 'AdminCursos' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminCursos') }"
              @click="cerrarDrawerMobile"
            >
              <q-icon name="menu_book" size="22px"
                :style="{ color: isActive('AdminCursos') ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Cursos
              </q-tooltip>
            </q-item>

            <q-item
              clickable v-ripple
              :to="{ name: 'AdminInstancias' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminInstancias') }"
              @click="cerrarDrawerMobile"
            >
              <q-icon name="calendar_month" size="22px"
                :style="{ color: isActive('AdminInstancias') ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Instancias
              </q-tooltip>
            </q-item>
          </template>

        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import logoImg from '../assets/logo-aula-pdv.png'

const router = useRouter()
const route  = useRoute()
const $q     = useQuasar()
const auth   = useAuthStore()
const drawer = ref(true)

const esAdmin = computed(() => auth.hasRole('administrador'))

const isProfesorActive = computed(() =>
  isActive('ProfesorSesion') ||
  isActive('PasarAsistencia') ||
  isActive('RegistrarNotas') ||
  isActive('ProfesorHistorial')
)

function isActive(routeName) {
  return route.name === routeName
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function cerrarDrawerMobile() {
  if ($q.screen.lt.md) drawer.value = false
}

function cerrarSesion() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.topbar-avatar {
  background: #0D1B3E;
  color: #FFFFFF;
}

.sidebar-item {
  width: 48px;
  min-height: 48px;
  border-radius: 10px;
  margin: 1px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
  position: relative;
}

/* Indicador de activo: barra dorada a la izquierda */
.sidebar-item-active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  background: #FFFFFF;
  border-radius: 0 3px 3px 0;
}

.sidebar-item-active {
  background: rgba(255, 255, 255, 0.12) !important;
}

.sidebar-item:hover:not(.sidebar-item-active) {
  background: rgba(255, 255, 255, 0.07) !important;
}

.sidebar-divider {
  width: 32px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 6px 0;
}
</style>

<style>
/* Sin scoped: tooltips renderizan en portal fuera del componente */
.pdv-tooltip {
  background: #0B1835 !important;
  color: white !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  padding: 5px 10px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35) !important;
}
</style>