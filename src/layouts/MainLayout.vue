<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated style="background: #0D1B3E;">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          text-color="white"
          @click="drawer = !drawer"
        />
        <q-toolbar-title class="q-ml-xs">
          <span class="text-white text-weight-bold">Aula PDV</span>
          <span class="q-ml-sm text-caption" style="color: #C9A96E;">Ministerio Pan de Vida</span>
        </q-toolbar-title>
        <q-space />
        <div class="q-mr-sm text-caption text-white row items-center">
          <span>{{ auth.user?.nombre }}</span>
          <template v-if="esAdmin">
            <span
              class="q-ml-sm row items-center no-wrap q-px-sm q-py-xs"
              style="background: #C9A96E; color: #2C1F0A; border-radius: 6px; font-size: 11px; font-weight: 700; gap: 4px;"
            >
              <i class="ti ti-crown" style="font-size: 13px; line-height: 1;"></i>
              Administrador
            </span>
          </template>
          <template v-else>
            <q-chip
              v-for="rol in auth.userRoles"
              :key="rol"
              dense
              size="xs"
              style="background: rgba(201,169,110,0.3); color: #E8D5B0;"
              class="q-ml-xs"
            >{{ rol }}</q-chip>
          </template>
        </div>
        <q-btn flat round dense icon="logout" text-color="white" @click="cerrarSesion" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :width="240"
      style="background: #0D1B3E;"
    >
      <q-list padding>
        <div class="q-px-md q-pt-sm q-pb-xs text-caption" style="color: #E8D5B0; opacity: 0.5; letter-spacing: 0.08em; text-transform: uppercase;">
          Menú
        </div>

        <template v-if="auth.hasRole('alumno')">
          <div class="q-px-md q-pt-md q-pb-xs text-caption" style="color: #C9A96E; opacity: 0.7;">Alumno</div>
          <q-item
            clickable
            v-ripple
            :to="{ name: 'AlumnoDashboard' }"
            class="menu-item"
            :class="{ 'menu-item-active': isActive('AlumnoDashboard') }"
          >
            <q-item-section avatar>
              <q-icon
                name="dashboard"
                :style="{ color: isActive('AlumnoDashboard') ? '#C9A96E' : '#E8D5B0' }"
              />
            </q-item-section>
            <q-item-section :style="{ color: isActive('AlumnoDashboard') ? '#C9A96E' : '#E8D5B0' }">
              Mi Dashboard
            </q-item-section>
          </q-item>
        </template>

        <template v-if="auth.hasRole('profesor')">
          <div class="q-px-md q-pt-md q-pb-xs text-caption" style="color: #C9A96E; opacity: 0.7;">Profesor</div>
          <q-item
            clickable
            v-ripple
            :to="{ name: 'ProfesorDashboard' }"
            class="menu-item"
            :class="{ 'menu-item-active': isActive('ProfesorDashboard') || isActive('PasarAsistencia') }"
          >
            <q-item-section avatar>
              <q-icon
                name="school"
                :style="{ color: isActive('ProfesorDashboard') || isActive('PasarAsistencia') ? '#C9A96E' : '#E8D5B0' }"
              />
            </q-item-section>
            <q-item-section :style="{ color: isActive('ProfesorDashboard') || isActive('PasarAsistencia') ? '#C9A96E' : '#E8D5B0' }">
              Mis Cursos
            </q-item-section>
          </q-item>
        </template>

        <template v-if="auth.hasRole('administrador')">
          <div class="q-px-md q-pt-md q-pb-xs text-caption" style="color: #C9A96E; opacity: 0.7;">Administración</div>
          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminUsuarios' }"
            class="menu-item"
            :class="{ 'menu-item-active': isActive('AdminUsuarios') }"
          >
            <q-item-section avatar>
              <q-icon
                name="people"
                :style="{ color: isActive('AdminUsuarios') ? '#C9A96E' : '#E8D5B0' }"
              />
            </q-item-section>
            <q-item-section :style="{ color: isActive('AdminUsuarios') ? '#C9A96E' : '#E8D5B0' }">
              Usuarios
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminCursos' }"
            class="menu-item"
            :class="{ 'menu-item-active': isActive('AdminCursos') }"
          >
            <q-item-section avatar>
              <q-icon
                name="menu_book"
                :style="{ color: isActive('AdminCursos') ? '#C9A96E' : '#E8D5B0' }"
              />
            </q-item-section>
            <q-item-section :style="{ color: isActive('AdminCursos') ? '#C9A96E' : '#E8D5B0' }">
              Cursos
            </q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminInstancias' }"
            class="menu-item"
            :class="{ 'menu-item-active': isActive('AdminInstancias') }"
          >
            <q-item-section avatar>
              <q-icon
                name="calendar_month"
                :style="{ color: isActive('AdminInstancias') ? '#C9A96E' : '#E8D5B0' }"
              />
            </q-item-section>
            <q-item-section :style="{ color: isActive('AdminInstancias') ? '#C9A96E' : '#E8D5B0' }">
              Instancias
            </q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const drawer = ref(true)

const esAdmin = computed(() => auth.hasRole('administrador'))

function isActive(routeName) {
  return route.name === routeName
}

function cerrarSesion() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.menu-item {
  border-radius: 8px;
  margin: 2px 8px;
  transition: background 0.2s;
}

.menu-item-active {
  background: rgba(201, 169, 110, 0.18) !important;
}

.menu-item:hover:not(.menu-item-active) {
  background: rgba(255, 255, 255, 0.07) !important;
}
</style>