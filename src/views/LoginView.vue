<template>
  <div class="auth-bg flex flex-center" style="min-height: 100vh; padding: 16px;">

    <!-- ── DESKTOP: card de dos columnas ── -->
    <div v-if="!$q.screen.lt.md" class="auth-card-desktop">

      <!-- Panel izquierdo navy -->
      <div class="auth-left-panel">
        <img :src="logoCrema" alt="Aula Pan de Vida" class="auth-logo" />
        <div class="auth-left-text">
          “Lámpara es a mis pies tu palabra,<br />
          y lumbrera a mi camino.”<br />
          Salmo 119:105
        </div>
      </div>

      <!-- Panel derecho: formulario -->
      <div class="auth-right-panel">
        <div class="auth-title">Iniciar sesión</div>
        <div class="auth-subtitle">Ingresa tus datos para entrar al aula.</div>

        <q-banner v-if="mensajeExito" dense class="q-mb-md auth-banner-ok">
          {{ mensajeExito }}
        </q-banner>

        <q-form ref="formRef" @submit.prevent="iniciarSesion" class="auth-form">
          <div class="auth-field">
            <div class="auth-label">Correo</div>
            <q-input
              v-model="form.email"
              type="email"
              placeholder="tucorreo@iglesia.cl"
              outlined dense
              class="auth-input"
              autocomplete="email"
              :rules="[val => !!val || 'El correo es requerido']"
            />
          </div>

          <div class="auth-field">
            <div class="auth-label">Contraseña</div>
            <q-input
              v-model="form.password"
              :type="mostrarPassword ? 'text' : 'password'"
              placeholder="••••••••"
              outlined dense
              class="auth-input"
              autocomplete="current-password"
              :rules="[val => !!val || 'La contraseña es requerida']"
            >
              <template #append>
                <q-icon
                  :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  style="color: #94A3B8; font-size: 18px;"
                  @click="mostrarPassword = !mostrarPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="text-right" style="margin-top: -4px;">
            <router-link :to="{ name: 'ForgotPassword' }" class="auth-link">
              ¿Olvidaste tu contraseña?
            </router-link>
          </div>

          <q-banner v-if="error" dense class="auth-banner-error">{{ error }}</q-banner>

          <q-btn type="submit" label="Entrar" unelevated class="full-width auth-btn" :loading="cargando" />
        </q-form>

        <div class="auth-footer">
          <span>¿No tienes cuenta?</span>
          <router-link :to="{ name: 'Register' }" class="auth-link q-ml-xs">Regístrate</router-link>
        </div>
      </div>
    </div>

    <!-- ── MOBILE: layout vertical navy ── -->
    <div v-else class="auth-mobile-wrapper">
      <div class="auth-mobile-header">
        <img :src="espiga" alt="" class="auth-mobile-espiga" />
        <img :src="nombreCrema" alt="Aula Pan de vida" class="auth-mobile-nombre" />
      </div>

      <div class="auth-mobile-card">
        <q-banner v-if="mensajeExito" dense class="q-mb-sm auth-banner-ok" style="font-size: 13px;">
          {{ mensajeExito }}
        </q-banner>

        <q-form ref="formRef" @submit.prevent="iniciarSesion" class="auth-form">
          <q-input
            v-model="form.email"
            type="email"
            label="Correo"
            outlined dense
            class="auth-input-mobile"
            autocomplete="email"
            :rules="[val => !!val || 'El correo es requerido']"
          />
          <q-input
            v-model="form.password"
            :type="mostrarPassword ? 'text' : 'password'"
            label="Contraseña"
            outlined dense
            class="auth-input-mobile"
            autocomplete="current-password"
            :rules="[val => !!val || 'La contraseña es requerida']"
          >
            <template #append>
              <q-icon
                :name="mostrarPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                style="color: #94A3B8; font-size: 18px;"
                @click="mostrarPassword = !mostrarPassword"
              />
            </template>
          </q-input>

          <q-banner v-if="error" dense class="auth-banner-error" style="font-size: 13px;">{{ error }}</q-banner>

          <q-btn type="submit" label="Entrar" unelevated class="full-width auth-btn" :loading="cargando" />
        </q-form>

        <div class="text-center" style="margin-top: 12px;">
          <router-link :to="{ name: 'ForgotPassword' }" class="auth-link" style="font-size: 13px;">
            ¿Olvidaste tu contraseña?
          </router-link>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import authService from '../services/auth'
import logoCrema from '../assets/logo-horizontal-crema.png'
import espiga from '../assets/espiga.png'
import nombreCrema from '../assets/nombre-crema.png'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const mensajeExito = computed(() =>
  route.query.mensaje === 'password-actualizada'
    ? 'Contraseña actualizada correctamente. Ingresa con tu nueva contraseña.'
    : null
)

const formRef = ref(null)
const form = ref({ email: '', password: '' })
const mostrarPassword = ref(false)
const cargando = ref(false)
const error = ref('')

const DESTINO_POR_ROL = {
  alumno: '/alumno/historial',
  profesor: '/profesor/sesion',
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
  min-height: 520px;
}

.auth-logo {
  height: 220px;
  width: auto;
  object-fit: contain;
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

.auth-title {
  font-size: 26px;
  font-weight: 700;
  color: #0D1B3E;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 14px;
  color: #64748B;
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
  color: #0D1B3E;
  letter-spacing: 0.01em;
}

/* ── Input desktop ── */
.auth-input :deep(.q-field__control) {
  background: white;
  border-radius: 8px !important;
}
.auth-input :deep(.q-field__control::before) {
  border-color: #94A3B8 !important;
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
.auth-input :deep(.q-placeholder) {
  color: #64748B;
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

/* ── Footer ── */
.auth-footer {
  margin-top: 20px;
  font-size: 13px;
  color: #64748B;
  text-align: center;
}

/* ── Banners ── */
.auth-banner-ok {
  background: #ECFDF5;
  color: #065F46;
  border-radius: 8px;
}
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
