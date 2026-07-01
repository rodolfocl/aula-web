<template>
  <q-page class="flex flex-center bg-grey-2" style="min-height: 100vh">
    <q-card class="q-pa-lg" style="min-width: 360px; max-width: 420px; width: 100%">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="school" size="3rem" color="primary" />
        <div class="text-h5 text-weight-bold text-primary q-mt-sm">Aula PDV</div>
        <div class="text-caption text-grey-6">Ministerio Pan de Vida</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="iniciarSesion" class="q-gutter-md">
          <q-input
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            outlined
            dense
            :rules="[val => !!val || 'El correo es requerido']"
          >
            <template #prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Contraseña"
            :type="mostrarPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[val => !!val || 'La contraseña es requerida']"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>
            <template #append>
              <q-icon
                :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="mostrarPassword = !mostrarPassword"
              />
            </template>
          </q-input>

          <q-banner v-if="error" class="bg-negative text-white rounded-borders" dense>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            label="Ingresar"
            color="primary"
            class="full-width"
            :loading="cargando"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <div class="text-caption text-grey-5">
          Acceso para usuarios registrados · PDV 2026
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

// Usuarios mockeados para desarrollo
const MOCK_USERS = {
  'alumno@pdv.cl': { token: 'mock-token-alumno', user: { id: 1, nombre: 'María González', email: 'alumno@pdv.cl', rol: 'alumno' } },
  'profesor@pdv.cl': { token: 'mock-token-profesor', user: { id: 2, nombre: 'Carlos Muñoz', email: 'profesor@pdv.cl', rol: 'profesor' } },
  'admin@pdv.cl': { token: 'mock-token-admin', user: { id: 3, nombre: 'Ana Torres', email: 'admin@pdv.cl', rol: 'admin' } },
}

async function iniciarSesion() {
  error.value = ''
  cargando.value = true

  await new Promise(r => setTimeout(r, 600))

  const mock = MOCK_USERS[form.value.email]
  if (mock && form.value.password === '123456') {
    auth.login(mock.token, mock.user)
    const destino = {
      alumno: '/alumno/dashboard',
      profesor: '/profesor/dashboard',
      admin: '/admin/usuarios',
    }[mock.user.rol]
    router.push(destino)
  } else {
    error.value = 'Correo o contraseña incorrectos.'
  }

  cargando.value = false
}
</script>