<template>
  <div class="flex flex-center" style="min-height: 100vh; background: #F0F2F5;">
    <q-card class="q-pa-lg" style="min-width: 360px; max-width: 420px; width: 100%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.10);">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="school" size="3rem" style="color: #0D1B3E;" />
        <div class="text-h5 text-weight-bold q-mt-sm" style="color: #0D1B3E;">Aula PDV</div>
        <div class="text-caption text-grey-6">Establecer nueva contraseña</div>
      </q-card-section>

      <!-- Token ausente -->
      <template v-if="!tokenPresente">
        <q-card-section class="text-center q-gutter-md">
          <q-icon name="error_outline" size="3rem" color="negative" />
          <div class="text-body1 text-weight-medium">Enlace inválido</div>
          <div class="text-caption text-grey-6">
            Este enlace de recuperación no es válido o ha expirado.
          </div>
        </q-card-section>
        <q-card-section class="text-center q-pt-none">
          <router-link :to="{ name: 'ForgotPassword' }" class="text-caption" style="color: #0D1B3E;">
            Solicitar un nuevo enlace
          </router-link>
        </q-card-section>
      </template>

      <!-- Formulario -->
      <template v-else>
        <q-card-section>
          <q-form ref="formRef" @submit.prevent="guardar" class="q-gutter-lg">
            <q-input
              v-model="form.nueva"
              label="Nueva contraseña"
              :type="mostrarNueva ? 'text' : 'password'"
              autofocus
              :rules="[
                val => !!val || 'La contraseña es requerida',
                val => val.length >= 3 || 'Mínimo 3 caracteres',
              ]"
              autocomplete="new-password"
            >
              <template #prepend><q-icon name="lock" style="color: #8B7355;" /></template>
              <template #append>
                <q-icon
                  :name="mostrarNueva ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  style="color: #8B7355;"
                  @click="mostrarNueva = !mostrarNueva"
                />
              </template>
            </q-input>

            <q-input
              v-model="form.confirmar"
              label="Confirmar contraseña"
              :type="mostrarConfirmar ? 'text' : 'password'"
              :rules="[
                val => !!val || 'Confirma tu contraseña',
                val => val === form.nueva || 'Las contraseñas no coinciden',
              ]"
              autocomplete="new-password"
            >
              <template #prepend><q-icon name="lock_reset" style="color: #8B7355;" /></template>
              <template #append>
                <q-icon
                  :name="mostrarConfirmar ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  style="color: #8B7355;"
                  @click="mostrarConfirmar = !mostrarConfirmar"
                />
              </template>
            </q-input>

            <q-banner v-if="error" class="bg-negative text-white rounded-borders" dense>
              {{ error }}
            </q-banner>

            <q-btn
              type="submit"
              label="Guardar contraseña"
              class="full-width pdv-btn-save"
              :loading="cargando"
              unelevated
            />
          </q-form>
        </q-card-section>

        <q-card-section class="text-center q-pt-none">
          <router-link :to="{ name: 'Login' }" class="text-caption" style="color: #0D1B3E;">
            Volver al inicio de sesión
          </router-link>
        </q-card-section>
      </template>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import authService from '../services/auth'

const route = useRoute()
const router = useRouter()

const tokenPresente = computed(() => !!route.query.token)

const formRef = ref(null)
const form = ref({ nueva: '', confirmar: '' })
const mostrarNueva = ref(false)
const mostrarConfirmar = ref(false)
const cargando = ref(false)
const error = ref('')

async function guardar() {
  const valid = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  cargando.value = true

  try {
    await authService.resetPassword(route.query.token, form.value.nueva)
    router.push({ name: 'Login', query: { mensaje: 'password-actualizada' } })
  } catch (err) {
    const status = err.response?.status
    if (status === 400) {
      error.value = 'El enlace es inválido o ha expirado. Solicita uno nuevo.'
    } else {
      error.value = 'Error al conectar con el servidor. Intenta más tarde.'
    }
  } finally {
    cargando.value = false
  }
}
</script>