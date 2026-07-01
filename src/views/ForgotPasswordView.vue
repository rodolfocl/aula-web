<template>
  <div class="flex flex-center" style="min-height: 100vh; background: #F0F2F5;">
    <q-card class="q-pa-lg" style="min-width: 360px; max-width: 420px; width: 100%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.10);">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="school" size="3rem" style="color: #0D1B3E;" />
        <div class="text-h5 text-weight-bold q-mt-sm" style="color: #0D1B3E;">Aula PDV</div>
        <div class="text-caption text-grey-6">Recuperar contraseña</div>
      </q-card-section>

      <!-- Estado: enviado -->
      <template v-if="enviado">
        <q-card-section class="text-center q-gutter-md">
          <q-icon name="mark_email_read" size="3rem" color="positive" />
          <div class="text-body1 text-weight-medium">Revisa tu correo</div>
          <div class="text-caption text-grey-6">
            Si <strong>{{ form.email }}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
          </div>
        </q-card-section>
        <q-card-section class="text-center q-pt-none">
          <router-link :to="{ name: 'Login' }" class="text-caption" style="color: #0D1B3E;">
            Volver al inicio de sesión
          </router-link>
        </q-card-section>
      </template>

      <!-- Estado: formulario -->
      <template v-else>
        <q-card-section>
          <div class="text-caption text-grey-6 q-mb-md">
            Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
          </div>
          <q-form ref="formRef" @submit.prevent="enviar" class="q-gutter-lg">
            <q-input
              v-model="form.email"
              label="Correo electrónico"
              type="email"
              autofocus
              :rules="[
                val => !!val || 'El correo es requerido',
                val => /.+@.+\..+/.test(val) || 'Correo inválido',
              ]"
              autocomplete="email"
            >
              <template #prepend><q-icon name="email" style="color: #8B7355;" /></template>
            </q-input>

            <q-banner v-if="error" class="bg-negative text-white rounded-borders" dense>
              {{ error }}
            </q-banner>

            <q-btn
              type="submit"
              label="Enviar enlace"
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
import { ref } from 'vue'
import authService from '../services/auth'

const formRef = ref(null)
const form = ref({ email: '' })
const cargando = ref(false)
const error = ref('')
const enviado = ref(false)

async function enviar() {
  const valid = await formRef.value.validate()
  if (!valid) return

  error.value = ''
  cargando.value = true

  try {
    await authService.forgotPassword(form.value.email)
    enviado.value = true
  } catch (err) {
    if (err.response?.status >= 500) {
      error.value = 'Error al conectar con el servidor. Intenta más tarde.'
    } else {
      enviado.value = true
    }
  } finally {
    cargando.value = false
  }
}
</script>