<template>
  <div class="flex flex-center" style="min-height: 100vh; background: #F0F2F5;">
    <q-card class="q-pa-lg" style="min-width: 360px; max-width: 420px; width: 100%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.10);">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="school" size="3rem" style="color: #0D1B3E;" />
        <div class="text-h5 text-weight-bold q-mt-sm" style="color: #0D1B3E;">Aula PDV</div>
        <div class="text-caption text-grey-6">Crear cuenta</div>
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit.prevent="registrar" class="q-gutter-lg">
          <q-input
            v-model="form.nombre"
            label="Nombre completo"
            :rules="[val => !!val || 'El nombre es requerido']"
            autocomplete="name"
          >
            <template #prepend><q-icon name="person" style="color: #8B7355;" /></template>
          </q-input>

          <q-input
            v-model="form.email"
            label="Correo electrónico"
            type="email"
            :rules="[
              val => !!val || 'El correo es requerido',
              val => /.+@.+\..+/.test(val) || 'Correo inválido',
            ]"
            autocomplete="email"
          >
            <template #prepend><q-icon name="email" style="color: #8B7355;" /></template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Contraseña"
            :type="mostrarPassword ? 'text' : 'password'"
            :rules="[
              val => !!val || 'La contraseña es requerida',
              val => val.length >= 8 || 'Mínimo 8 caracteres',
            ]"
            autocomplete="new-password"
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

          <q-input
            v-model="form.confirmar"
            label="Confirmar contraseña"
            :type="mostrarPassword ? 'text' : 'password'"
            :rules="[val => val === form.password || 'Las contraseñas no coinciden']"
            autocomplete="new-password"
          >
            <template #prepend><q-icon name="lock_outline" style="color: #8B7355;" /></template>
          </q-input>

          <q-banner v-if="error" class="bg-negative text-white rounded-borders" dense>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            label="Crear cuenta"
            class="full-width pdv-btn-save"
            :loading="cargando"
            unelevated
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <span class="text-caption text-grey-6">¿Ya tienes cuenta?</span>
        <router-link :to="{ name: 'Login' }" class="text-caption q-ml-xs" style="color: #0D1B3E;">
          Iniciar sesión
        </router-link>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import authService from '../services/auth'

const router = useRouter()
const $q = useQuasar()

const formRef = ref(null)
const form = ref({ nombre: '', email: '', password: '', confirmar: '' })
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

async function registrar() {
  const valid = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  cargando.value = true

  try {
    await authService.register(form.value.nombre, form.value.email, form.value.password)
    $q.notify({ type: 'positive', message: 'Cuenta creada. Ahora puedes iniciar sesión.' })
    router.push({ name: 'Login' })
  } catch (err) {
    const status = err.response?.status
    if (status === 409) {
      error.value = 'Ya existe una cuenta con ese correo.'
    } else if (status === 400) {
      error.value = err.response?.data?.message ?? 'Datos inválidos.'
    } else {
      error.value = 'Error al conectar con el servidor. Intenta más tarde.'
    }
  } finally {
    cargando.value = false
  }
}
</script>