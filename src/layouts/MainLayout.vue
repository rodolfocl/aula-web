<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated style="background: #0B1835; min-height: 70px;">
      <q-toolbar style="min-height: 70px;">
        <q-toolbar-title shrink>
          <img :src="logoImg" alt="Aula PDV" style="height: 72px; width: auto; object-fit: contain; display: block;" />
        </q-toolbar-title>
        <q-space />
        <div class="row items-center q-mr-sm" style="gap: 12px;">
          <div class="column items-end" style="gap: 4px;">
            <span style="color: #FFFFFF; font-size: 15px; font-weight: 500; line-height: 1;">
              {{ auth.user?.full_name ?? auth.user?.nombre }}
            </span>
            <div class="row items-center" style="gap: 4px;">
              <template v-if="esAdmin">
                <span
                  class="row items-center no-wrap"
                  style="background: #C9A96E; color: #2C1F0A; border-radius: 99px; font-size: 11px; font-weight: 700; padding: 2px 8px; gap: 4px; line-height: 1.4;"
                >
                  Administrador
                  <i class="ti ti-crown" style="font-size: 11px; line-height: 1;"></i>
                </span>
              </template>
              <template v-else>
                <span
                  v-for="rol in auth.userRoles"
                  :key="rol"
                  style="background: rgba(255,255,255,0.15); color: #FFFFFF; border-radius: 99px; font-size: 11px; padding: 2px 8px; line-height: 1.4;"
                >{{ rol }}</span>
              </template>
            </div>
          </div>
          <q-btn flat round dense icon="logout" text-color="white" @click="cerrarSesion" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :width="64"
      style="background: #0B1835;"
    >
      <div class="column items-center" style="padding-top: 70px;">
        <div class="column items-center q-pt-sm" style="width: 64px;">

        <template v-if="auth.hasRole('alumno')">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'AlumnoDashboard' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('AlumnoDashboard') }"
          >
            <i
              class="ti ti-history"
              :style="`font-size: 22px; color: ${isActive('AlumnoDashboard') ? '#C9A96E' : '#FFFFFF'};`"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Mi Historial
            </q-tooltip>
          </q-item>
        </template>

        <div class="sidebar-sep" />

        <template v-if="auth.hasRole('profesor')">
          <q-item
            clickable
            v-ripple
            :to="{ name: 'ProfesorDashboard' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('ProfesorDashboard') || isActive('PasarAsistencia') }"
          >
            <i
              class="ti ti-chalkboard"
              :style="`font-size: 22px; color: ${isActive('ProfesorDashboard') || isActive('PasarAsistencia') ? '#C9A96E' : '#FFFFFF'};`"
            />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Vista Profesor
            </q-tooltip>
          </q-item>
        </template>

        <div
          v-if="(auth.hasRole('administrador') || auth.hasRole('profesor')) && auth.hasRole('alumno')"
          class="sidebar-sep"
        />

        <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
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
import logoImg from '../assets/logo-aula-pdv.png'

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
  background: #0B1835 !important;
  color: white !important;
  border-radius: 6px !important;
  font-size: 13px !important;
  padding: 6px 12px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4) !important;
}
</style>