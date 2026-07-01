<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated style="background: #0D1B3E;">
      <q-toolbar>
        <q-toolbar-title>
          <span class="text-white text-weight-bold">Aula PDV</span>
          <span class="q-ml-sm text-caption" style="color: #C9A96E;">Ministerio Pan de Vida</span>
        </q-toolbar-title>
        <q-space />
        <div class="q-mr-sm text-caption text-white row items-center">
          <span style="color: #FFFFFF; font-size: 15px;">{{ auth.user?.nombre }}</span>
          <template v-if="esAdmin">
            <span
              class="q-ml-sm row items-center no-wrap q-px-sm q-py-xs"
              style="background: #C9A96E; color: #2C1F0A; border-radius: 6px; font-size: 11px; font-weight: 700; gap: 4px;"
            >
              Administrador
              <i class="ti ti-crown" style="font-size: 13px; line-height: 1;"></i>
            </span>
          </template>
          <template v-else>
            <q-chip
              v-for="rol in auth.userRoles"
              :key="rol"
              dense
              size="xs"
              style="background: rgba(201,169,110,0.3); color: #FFFFFF;"
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
      :width="64"
      style="background: #0D1B3E;"
    >
      <div class="column items-center">

        <!-- Logo de la iglesia -->
        <div style="width: 64px; height: 64px; background: #0D1B3E; flex-shrink: 0; padding: 8px; box-sizing: border-box;">
          <img :src="trigoImg" alt="Logo Pan de Vida" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>

        <div class="column items-center q-pt-sm" style="width: 64px;">

        <template v-if="auth.hasRole('alumno')">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'AlumnoDashboard' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('AlumnoDashboard') }"
          >
            <q-icon
              name="dashboard"
              size="22px"
              :style="{ color: isActive('AlumnoDashboard') ? '#C9A96E' : '#FFFFFF' }"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Mi Dashboard
            </q-tooltip>
          </q-item>
        </template>

        <div
          v-if="auth.hasRole('alumno') && (auth.hasRole('profesor') || auth.hasRole('administrador'))"
          class="sidebar-sep"
        />

        <template v-if="auth.hasRole('profesor')">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'ProfesorDashboard' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('ProfesorDashboard') || isActive('PasarAsistencia') }"
          >
            <q-icon
              name="school"
              size="22px"
              :style="{ color: isActive('ProfesorDashboard') || isActive('PasarAsistencia') ? '#C9A96E' : '#FFFFFF' }"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Mis Cursos
            </q-tooltip>
          </q-item>
        </template>

        <div
          v-if="auth.hasRole('administrador') && (auth.hasRole('alumno') || auth.hasRole('profesor'))"
          class="sidebar-sep"
        />

        <template v-if="auth.hasRole('administrador')">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminUsuarios' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('AdminUsuarios') }"
          >
            <q-icon
              name="people"
              size="22px"
              :style="{ color: isActive('AdminUsuarios') ? '#C9A96E' : '#FFFFFF' }"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Usuarios
            </q-tooltip>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminCursos' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('AdminCursos') }"
          >
            <q-icon
              name="menu_book"
              size="22px"
              :style="{ color: isActive('AdminCursos') ? '#C9A96E' : '#FFFFFF' }"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Cursos
            </q-tooltip>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'AdminInstancias' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('AdminInstancias') }"
          >
            <q-icon
              name="calendar_month"
              size="22px"
              :style="{ color: isActive('AdminInstancias') ? '#C9A96E' : '#FFFFFF' }"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Instancias
            </q-tooltip>
          </q-item>
        </template>

        </div><!-- fin menú -->
      </div><!-- fin sidebar -->
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
import trigoImg from '../assets/trigo.png'

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
.sidebar-item {
  width: 48px;
  min-height: 48px;
  border-radius: 10px;
  margin: 2px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.sidebar-item-active {
  background: rgba(201, 169, 110, 0.18) !important;
}

.sidebar-item:hover:not(.sidebar-item-active) {
  background: rgba(255, 255, 255, 0.07) !important;
}

.sidebar-sep {
  width: 32px;
  height: 1px;
  background: rgba(232, 213, 176, 0.15);
  margin: 8px 0;
}
</style>

<style>
/* Sin scoped: q-tooltip renderiza en un portal fuera del componente */
.pdv-tooltip {
  background: #0D1B3E !important;
  color: white !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
}
</style>