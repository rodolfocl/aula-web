<template>
  <div class="auth-bg flex flex-center" style="min-height: 100vh; padding: 16px;">

    <!-- ── DESKTOP: card de dos columnas ── -->
    <div v-if="!$q.screen.lt.md" class="auth-card-desktop">

      <!-- Panel izquierdo navy -->
      <div class="auth-left-panel">
        <img :src="logoCrema" alt="Aula Pan de Vida" class="auth-logo" />
        <div class="auth-left-text">
          Te enviaremos un enlace para restablecer tu contraseña.
        </div>
      </div>

      <!-- Panel derecho: formulario -->
      <div class="auth-right-panel">

        <!-- Estado: enviado -->
        <template v-if="enviado">
          <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 12px;">
            <div class="espiga-icon-box">
              <img :src="espiga" alt="" style="height: 28px;" />
            </div>
            <div class="auth-title">Revisa tu correo</div>
            <div class="auth-subtitle" style="margin-bottom: 0;">
              Si <strong style="color: #0D1B3E;">{{ form.email }}</strong> está registrado,
              recibirás un enlace para restablecer tu contraseña.
            </div>
            <router-link :to="{ name: 'Login' }" class="auth-link q-mt-md">
              ← Volver a iniciar sesión
            </router-link>
          </div>
        </template>

        <!-- Estado: formulario -->
        <template v-else>
          <div class="auth-title">¿Olvidaste tu contraseña?</div>
          <div class="auth-subtitle">
            Escribe el correo con el que te registraste y te enviaremos las instrucciones.
          </div>

          <q-form ref="formRef" @submit.prevent="enviar" class="auth-form">
            <div class="auth-field">
              <div class="auth-label">Correo</div>
              <q-input
                v-model="form.email"
                type="email"
                placeholder="tucorreo@iglesia.cl"
                outlined dense
                class="auth-input"
                autofocus
                autocomplete="email"
                :rules="[
                  val => !!val || 'El correo es requerido',
                  val => /.+@.+\..+/.test(val) || 'Correo inválido',
                ]"
              />
            </div>

            <q-banner v-if="error" dense class="auth-banner-error">{{ error }}</q-banner>

            <q-btn type="submit" label="Enviar enlace" unelevated class="full-width auth-btn" :loading="cargando" />
            
          </q-form>

          <div class="text-center" style="margin-top: 20px;">
            <router-link :to="{ name: 'Login' }" class="auth-link">
              ← Volver a iniciar sesión
            </router-link>
          </div>
        </template>

      </div>
    </div>

    <!-- ── MOBILE: layout vertical navy ── -->
    <div v-else class="auth-mobile-wrapper">
      <div class="auth-mobile-header">
        <img :src="espiga" alt="" class="auth-mobile-espiga" />
        <img :src="nombreCrema" alt="Aula Pan de vida" class="auth-mobile-nombre" />
      </div>

      <div class="auth-mobile-card">

        <!-- Estado: enviado (mobile) -->
        <template v-if="enviado">
          <div style="text-align: center; padding: 8px 0;">
            <div style="font-size: 15px; font-weight: 700; color: #0D1B3E; margin-bottom: 8px;">Revisa tu correo</div>
            <div style="font-size: 13px; color: #64748B; line-height: 1.5; margin-bottom: 20px;">
              Si <strong>{{ form.email }}</strong> está registrado,
              recibirás un enlace para restablecer tu contraseña.
            </div>
            <router-link :to="{ name: 'Login' }" class="auth-link" style="font-size: 13px;">
              ← Volver a iniciar sesión
            </router-link>
          </div>
        </template>

        <!-- Estado: formulario (mobile) -->
        <template v-else>
          <q-form ref="formRef" @submit.prevent="enviar" class="auth-form">
            <q-input
              v-model="form.email"
              type="email"
              label="Correo"
              outlined dense
              class="auth-input-mobile"
              autocomplete="email"
              :rules="[
                val => !!val || 'El correo es requerido',
                val => /.+@.+\..+/.test(val) || 'Correo inválido',
              ]"
            />

            <q-banner v-if="error" dense class="auth-banner-error" style="font-size: 13px;">{{ error }}</q-banner>

            <q-btn type="submit" label="Enviar enlace" unelevated class="full-width auth-btn" :loading="cargando" />
          </q-form>

          <div class="text-center" style="margin-top: 12px;">
            <router-link :to="{ name: 'Login' }" class="auth-link" style="font-size: 13px;">
              ← Volver a iniciar sesión
            </router-link>
          </div>
        </template>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import authService from '../services/auth'
import logoCrema from '../assets/logo-principal-crema.png'
import espiga from '../assets/espiga.png'
import nombreCrema from '../assets/nombre-crema.png'

const $q = useQuasar()
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

<style scoped>
/* ── Fondo de página ── */
.auth-bg {
  background: #EDE9E0;
}

/* ── Card desktop (dos columnas) ── */
.auth-card-desktop {
  display: flex;
  width: 100%;
  max-width: 840px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.14);
}

/* ── Panel izquierdo navy ── */
.auth-left-panel {
  width: 42%;
  flex-shrink: 0;
  background: #0B1835;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 480px;
}

.auth-logo {
  height: 70px;
  object-fit: contain;
  object-position: left center;
}

.auth-left-text {
  color: rgba(255, 255, 255, 0.68);
  font-size: 14px;
  line-height: 1.65;
}

/* ── Panel derecho blanco ── */
.auth-right-panel {
  flex: 1;
  background: white;
  padding: 48px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ── Ícono decorativo espiga ── */
.espiga-icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #FAF3E7;
}

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #0D1B3E;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 14px;
  color: #64748B;
  line-height: 1.55;
  margin-bottom: 28px;
}

/* ── Formulario ── */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.auth-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

/* ── Input desktop: fondo crema ── */
.auth-input :deep(.q-field__control) {
  background: #FAF8F3;
  border-radius: 8px !important;
}
.auth-input :deep(.q-field__control::before) {
  border-color: #DDD5C8 !important;
  border-radius: 8px !important;
}
.auth-input :deep(.q-field__control:hover::before) {
  border-color: #C9A96E !important;
}
.auth-input :deep(.q-field--focused .q-field__control::after) {
  border-color: #0D1B3E !important;
  border-radius: 8px !important;
}
.auth-input :deep(.q-field__native) {
  color: #0D1B3E;
  font-size: 14px;
}

/* ── Botón ── */
.auth-btn {
  background: #0D1B3E !important;
  color: white !important;
  border-radius: 10px !important;
  height: 48px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: 0.01em;
}

/* ── Links dorados ── */
.auth-link {
  color: #C9A96E;
  font-size: 13px;
  text-decoration: none;
  font-weight: 500;
}
.auth-link:hover {
  text-decoration: underline;
}

/* ── Banners ── */
.auth-banner-error {
  background: #FEF2F2;
  color: #991B1B;
  border-radius: 8px;
}

/* ── MOBILE ── */
.auth-mobile-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-mobile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px 32px;
  width: 100%;
  background: #0B1835;
  border-radius: 20px 20px 0 0;
}

.auth-mobile-espiga {
  height: 52px;
  object-fit: contain;
  margin-bottom: 10px;
}

.auth-mobile-nombre {
  height: 48px;
  object-fit: contain;
}

.auth-mobile-card {
  background: white;
  border-radius: 16px;
  padding: 28px 24px 24px;
  width: 100%;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  margin-top: -1px;
}

/* ── Input mobile: fondo blanco ── */
.auth-input-mobile :deep(.q-field__control) {
  background: white;
  border-radius: 8px !important;
}
.auth-input-mobile :deep(.q-field__control::before) {
  border-color: #E2E8F0 !important;
  border-radius: 8px !important;
}
.auth-input-mobile :deep(.q-field__control:hover::before) {
  border-color: #C9A96E !important;
}
.auth-input-mobile :deep(.q-field--focused .q-field__control::after) {
  border-color: #0D1B3E !important;
  border-radius: 8px !important;
}
.auth-input-mobile :deep(.q-field__native) {
  color: #0D1B3E;
  font-size: 14px;
}
</style>
