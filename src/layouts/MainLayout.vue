<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>
          <span class="text-weight-bold">Aula PDV</span>
          <span class="text-caption q-ml-sm opacity-70">Ministerio Pan de Vida</span>
        </q-toolbar-title>
        <q-space />
        <div class="q-mr-sm text-caption">
          {{ auth.user?.nombre }} ({{ auth.userRole }})
        </div>
        <q-btn flat round dense icon="logout" @click="cerrarSesion" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above bordered>
      <q-list padding>
        <q-item-label header class="text-grey-7">Menú</q-item-label>

        <template v-if="auth.userRole === 'alumno'">
          <q-item clickable v-ripple :to="{ name: 'AlumnoDashboard' }">
            <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
            <q-item-section>Mi Dashboard</q-item-section>
          </q-item>
        </template>

        <template v-if="auth.userRole === 'profesor'">
          <q-item clickable v-ripple :to="{ name: 'ProfesorDashboard' }">
            <q-item-section avatar><q-icon name="school" /></q-item-section>
            <q-item-section>Mis Cursos</q-item-section>
          </q-item>
        </template>

        <template v-if="auth.userRole === 'admin'">
          <q-item clickable v-ripple :to="{ name: 'AdminUsuarios' }">
            <q-item-section avatar><q-icon name="people" /></q-item-section>
            <q-item-section>Usuarios</q-item-section>
          </q-item>
          <q-item clickable v-ripple :to="{ name: 'AdminCursos' }">
            <q-item-section avatar><q-icon name="menu_book" /></q-item-section>
            <q-item-section>Cursos</q-item-section>
          </q-item>
          <q-item clickable v-ripple :to="{ name: 'AdminInstancias' }">
            <q-item-section avatar><q-icon name="calendar_month" /></q-item-section>
            <q-item-section>Instancias</q-item-section>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()
const drawer = ref(false)

function cerrarSesion() {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>