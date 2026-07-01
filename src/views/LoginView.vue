<template>
  <div class="flex flex-center" style="min-height: 100vh; background: #F0F2F5;">
    <q-card class="q-pa-lg" style="min-width: 360px; max-width: 420px; width: 100%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.10);">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="school" size="3rem" style="color: #0D1B3E;" />
        <div class="text-h5 text-weight-bold q-mt-sm" style="color: #0D1B3E;">Aula PDV</div>
        <div class="text-caption text-grey-6">Ministerio Pan de Vida</div>
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit.prevent="iniciarSesion" class="q-gutter-lg">
          <q-input
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            :rules="[val => !!val || 'El correo es requerido']"
            autocomplete="email"
          >
            <template #prepend><q-icon name="email" style="color: #8B7355;" /></template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Contraseña"
            :type="mostrarPassword ? 'text' : 'password'"
            :rules="[val => !!val || 'La contraseña es requerida']"
            autocomplete="current-password"
          >
            <template #prepend><q-icon name="lock" style="color: #8B7355;" /></template>
            <template #append>
              <q-icon
                :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                style="color: #8B7355;"
                @click="mostrarPassword = !mostrarPassword"
              />
            </template>
          </q-input>

          <div class="text-right">
            <router-link :to="{ name: 'ForgotPassword' }" class="text-caption" style="color: #0D1B3E;">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>

          <q-banner v-if="error" class="bg-negative text-white rounded-borders" dense>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            label="Ingresar"
            class="full-width pdv-btn-save"
            :loading="cargando"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <span class="text-caption text-grey-6">¿No tienes cuenta?</span>
        <router-link :to="{ name: 'Register' }" class="text-caption q-ml-xs" style="color: #0D1B3E;">
          Regístrate
        </router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import authService from '../services/auth'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref(null)
const form = ref({ email: '', password: '' })
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

const DESTINO_POR_ROL = {
  alumno: '/alumno/dashboard',
  profesor: '/profesor/dashboard',
  admin: '/admin/usuarios',
}

async function iniciarSesion() {
  const valid = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  cargando.value = true

  try {
    const { token, user } = await authService.login(form.value.email, form.value.password)
    auth.login(token, user)
    router.push(DESTINO_POR_ROL[user.rol] ?? '/')
  } catch (err) {
    const status = err.response?.status
    if (status === 401 || status === 400) {
      error.value = 'Correo o contraseña incorrectos.'
    } else {
      error.value = 'Error al conectar con el servidor. Intenta más tarde.'
    }
  } finally {
    cargando.value = false
  }
}
</script>