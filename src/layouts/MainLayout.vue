<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ── TOPBAR ──────────────────────────────────────────── -->
    <q-header style="background: #FFFFFF; box-shadow: var(--pdv-shadow-topbar); min-height: 64px;">
      <q-toolbar style="min-height: 64px; padding: 0 16px;">

        <!-- Hamburger — solo en mobile (en desktop está dentro del sidebar) -->
        <q-btn
          v-if="$q.screen.lt.md"
          flat round dense icon="menu"
          color="grey-7" class="q-mr-xs"
          @click="toggleHamburger"
        />

        <q-space />

        <!-- Derecha: campana + bloque usuario -->
        <div class="row items-center no-wrap" style="gap: 4px;">

          <!-- Notificaciones (decorativo) -->
          <q-btn flat round dense icon="notifications_none" color="grey-6" size="sm">
            <q-tooltip class="pdv-tooltip" anchor="bottom middle" self="top middle">Notificaciones</q-tooltip>
          </q-btn>

          <!-- Bloque usuario clickeable -->
          <div class="user-block">
            <div class="pdv-avatar pdv-avatar-md topbar-avatar">
              <img v-if="auth.user?.avatar" :src="auth.user.avatar" class="avatar-img" />
              <template v-else>{{ iniciales(auth.user?.full_name ?? auth.user?.nombre ?? '?') }}</template>
            </div>

            <!-- ── QMenu desplegable ── -->
            <q-menu
              anchor="bottom right"
              self="top right"
              :offset="[0, 8]"
              class="user-menu"
              style="min-width: 240px; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); border: 1px solid #F1F5F9;"
            >
              <!-- Header del menú (no clickeable) -->
              <div class="user-menu-header">
                <div style="min-width: 0;">
                  <div style="font-weight: 600; font-size: 14px; color: #0D1B3E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ auth.user?.full_name ?? auth.user?.nombre }}
                  </div>
                  <div style="font-size: 12px; color: #64748B; text-transform: capitalize; margin-top: 2px;">
                    {{ esAdmin ? 'Administrador' : (auth.userRoles.join(' · ') || '—') }}
                  </div>
                </div>
              </div>

              <q-separator style="border-color: #F1F5F9;" />

              <!-- Subir foto -->
              <q-item clickable v-ripple class="user-menu-item" @click="abrirSubirFoto">
                <q-item-section avatar style="min-width: 36px;">
                  <q-icon name="photo_camera" size="18px" color="grey-7" />
                </q-item-section>
                <q-item-section>
                  <q-item-label style="font-size: 13.5px; color: #1E293B;">{{ auth.user?.avatar ? 'Cambiar foto' : 'Subir foto' }}</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Eliminar foto (solo si hay foto) -->
              <q-item v-if="auth.user?.avatar" clickable v-ripple class="user-menu-item" @click="eliminarFoto">
                <q-item-section avatar style="min-width: 36px;">
                  <q-icon name="hide_image" size="18px" color="grey-7" />
                </q-item-section>
                <q-item-section>
                  <q-item-label style="font-size: 13.5px; color: #1E293B;">Eliminar foto</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Cambiar contraseña -->
              <q-item clickable v-ripple class="user-menu-item" @click="abrirCambioPassword">
                <q-item-section avatar style="min-width: 36px;">
                  <q-icon name="lock_outline" size="18px" color="grey-7" />
                </q-item-section>
                <q-item-section>
                  <q-item-label style="font-size: 13.5px; color: #1E293B;">Cambiar contraseña</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator style="border-color: #F1F5F9;" />

              <!-- Cerrar sesión -->
              <q-item clickable v-ripple class="user-menu-item" @click="cerrarSesion">
                <q-item-section avatar style="min-width: 36px;">
                  <q-icon name="logout" size="18px" style="color: #DC2626;" />
                </q-item-section>
                <q-item-section>
                  <q-item-label style="font-size: 13.5px; color: #DC2626; font-weight: 500;">Cerrar sesión</q-item-label>
                </q-item-section>
              </q-item>
            </q-menu>
          </div>

        </div>
      </q-toolbar>
    </q-header>

    <!-- ── SIDEBAR ──────────────────────────────────────────── -->
    <q-drawer
      v-model="drawer"
      show-if-above
      :mini="miniState"
      :mini-to-overlay="!sidebarPinned"
      :width="220"
      :mini-width="64"
      style="background: #0B1835;"
    >
      <div style="display: flex; flex-direction: column; height: 100%;">

        <!-- Franja superior: logo + controles (misma altura que el topbar) -->
        <div class="sidebar-brand" :class="{ 'sidebar-brand--mini': miniState }">

          <!-- Expandido: logo completo crema -->
          <img
            v-show="!miniState"
            :src="logoCremaImg"
            alt="Aula Pan de Vida"
            class="sidebar-brand-logo"
          />

          <!-- Mini: solo la espiga, clic = toggle rápido -->
          <img
            v-show="miniState"
            :src="espigaImg"
            alt="Aula Pan de Vida"
            class="sidebar-brand-espiga"
            @click="toggleHamburger"
          />

          <!-- Hamburguesa: desktop, visible cuando expandido y NO pinned -->
          <q-btn
            v-if="!$q.screen.lt.md"
            v-show="!miniState && !sidebarPinned"
            flat round dense icon="menu"
            style="color: rgba(255,255,255,0.65);"
            @click="toggleHamburger"
          >
            <q-tooltip class="pdv-tooltip" anchor="center right" self="center left" :offset="[12, 0]">
              Mostrar/ocultar menú
            </q-tooltip>
          </q-btn>

          <!-- Pin: desktop, visible cuando expandido -->
          <q-btn
            v-if="!$q.screen.lt.md"
            v-show="!miniState"
            flat round dense icon="push_pin"
            :style="sidebarPinned ? 'color: #C9A96E;' : 'color: rgba(255,255,255,0.4);'"
            @click="togglePin"
          >
            <q-tooltip class="pdv-tooltip" anchor="center right" self="center left" :offset="[12, 0]">
              {{ sidebarPinned ? 'Desfijar menú' : 'Fijar menú expandido' }}
            </q-tooltip>
          </q-btn>

        </div>

        <div class="sidebar-divider" style="margin: 0 16px 8px;" />

        <div class="column" style="width: 100%; gap: 2px; padding: 0 8px; flex: 1;">

          <template v-if="auth.hasRole('alumno')">
            <q-item
              clickable v-ripple
              :to="{ name: 'AlumnoHistorial' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AlumnoHistorial') }"
              @click="cerrarDrawerMobile"
            >
              <q-item-section avatar class="sidebar-icon-col">
                <i class="ti ti-history"
                  :style="`font-size: 22px; color: ${isActive('AlumnoHistorial') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              </q-item-section>
              <q-item-section>
                <span class="sidebar-label" :style="`color: ${isActive('AlumnoHistorial') ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}`">Mi Historial</span>
              </q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Mi Historial
              </q-tooltip>
            </q-item>
          </template>

          <div class="sidebar-divider" />

          <template v-if="auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'ProfesorSesion' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isProfesorActive }"
              @click="cerrarDrawerMobile"
            >
              <q-item-section avatar class="sidebar-icon-col">
                <i class="ti ti-chalkboard"
                  :style="`font-size: 22px; color: ${isProfesorActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              </q-item-section>
              <q-item-section>
                <span class="sidebar-label" :style="`color: ${isProfesorActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}`">Mis Clases</span>
              </q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Mis Clases
              </q-tooltip>
            </q-item>
          </template>

          <div
            v-if="(auth.hasRole('administrador') || auth.hasRole('profesor')) && auth.hasRole('alumno')"
            class="sidebar-divider"
          />

          <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'AdminUsuarios' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminUsuarios') }"
              @click="cerrarDrawerMobile"
            >
              <q-item-section avatar class="sidebar-icon-col">
                <q-icon name="people" size="22px"
                  :style="{ color: isActive('AdminUsuarios') ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }" />
              </q-item-section>
              <q-item-section>
                <span class="sidebar-label" :style="`color: ${isActive('AdminUsuarios') ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}`">Usuarios</span>
              </q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Usuarios
              </q-tooltip>
            </q-item>

            <q-item
              clickable v-ripple
              :to="{ name: 'AdminCursos' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminCursos') }"
              @click="cerrarDrawerMobile"
            >
              <q-item-section avatar class="sidebar-icon-col">
                <i class="ti ti-template"
                  :style="`font-size: 22px; color: ${isActive('AdminCursos') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              </q-item-section>
              <q-item-section>
                <span class="sidebar-label" :style="`color: ${isActive('AdminCursos') ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}`">Plantilla de Cursos</span>
              </q-item-section>
              <q-tooltip v-if="miniState" anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Plantilla de Cursos
              </q-tooltip>
            </q-item>

          </template>

        </div>

      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- ── DIÁLOGO: Cambiar contraseña ──────────────────────── -->
    <q-dialog v-model="dialogoCambioPassword" :maximized="$q.screen.lt.sm" @hide="resetFormPassword">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 400px;'">
        <div class="pdv-dialog-title">Cambiar contraseña</div>
        <div class="pdv-dialog-body">
          <q-input
            v-model="formPassword.current"
            label="Contraseña actual"
            :type="showCurrent ? 'text' : 'password'"
            outlined dense
            :error="!!erroresPassword.current"
            :error-message="erroresPassword.current"
          >
            <template #append>
              <q-icon
                :name="showCurrent ? 'visibility_off' : 'visibility'"
                class="cursor-pointer" color="grey-6" size="20px"
                @click="showCurrent = !showCurrent"
              />
            </template>
          </q-input>

          <q-input
            v-model="formPassword.nueva"
            label="Nueva contraseña"
            :type="showNueva ? 'text' : 'password'"
            outlined dense
            :error="!!erroresPassword.nueva"
            :error-message="erroresPassword.nueva"
          >
            <template #append>
              <q-icon
                :name="showNueva ? 'visibility_off' : 'visibility'"
                class="cursor-pointer" color="grey-6" size="20px"
                @click="showNueva = !showNueva"
              />
            </template>
          </q-input>

          <q-input
            v-model="formPassword.confirmar"
            label="Confirmar nueva contraseña"
            :type="showConfirmar ? 'text' : 'password'"
            outlined dense
            :error="!!erroresPassword.confirmar"
            :error-message="erroresPassword.confirmar"
          >
            <template #append>
              <q-icon
                :name="showConfirmar ? 'visibility_off' : 'visibility'"
                class="cursor-pointer" color="grey-6" size="20px"
                @click="showConfirmar = !showConfirmar"
              />
            </template>
          </q-input>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Guardar" class="pdv-btn-save"
            :loading="guardandoPassword"
            @click="guardarPassword"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── DIÁLOGO: Subir foto ──────────────────────────────── -->
    <q-dialog v-model="dialogoSubirFoto" :maximized="$q.screen.lt.sm" @hide="resetSubirFoto">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 380px;'">
        <div class="pdv-dialog-title">Foto de perfil</div>
        <div class="pdv-dialog-body" style="align-items: center;">

          <!-- Preview -->
          <div class="foto-preview">
            <img v-if="fotoPreview" :src="fotoPreview" class="foto-preview-img" />
            <div v-else class="foto-preview-placeholder">
              <q-icon name="photo_camera" size="36px" color="grey-4" />
            </div>
          </div>

          <!-- Error de validación -->
          <div v-if="errorFoto" style="color: #DC2626; font-size: 13px; text-align: center;">{{ errorFoto }}</div>

          <!-- Botón seleccionar archivo -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display: none;"
            @change="onArchivoSeleccionado"
          />
          <q-btn
            outline label="Seleccionar imagen"
            icon="upload"
            color="grey-7"
            style="border-radius: 8px;"
            @click="fileInputRef.click()"
          />
          <div style="font-size: 11px; color: #94A3B8; text-align: center;">
            JPEG, PNG o WebP · Máx. 2 MB
          </div>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Guardar" class="pdv-btn-save"
            :disable="!fotoPreview || !!errorFoto"
            :loading="guardandoFoto"
            @click="guardarFoto"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import logoImg from '../assets/logo-principal-azul.png'
import logoCremaImg from '../assets/logo-principal-crema.png'
import espigaImg from '../assets/espiga.png'

const router = useRouter()
const route  = useRoute()
const $q     = useQuasar()
const auth   = useAuthStore()

// Estado mobile del drawer (abierto/cerrado)
const drawer = ref(false)

// Pin: el usuario fijó el sidebar expandido de forma permanente (solo desktop)
// Responsabilidad exclusiva del botón pin — guardado en localStorage
const sidebarPinned = ref(JSON.parse(localStorage.getItem('pdv-sidebar-pinned') ?? 'false'))

// Estado visual mini del drawer (:mini) — false = expandido, true = mini
// Controlado solo por toggleHamburger (manual) y togglePin (permanente).
const miniState = ref(!sidebarPinned.value)

// ── Refs de UI ────────────────────────────────────────────
const dialogoCambioPassword = ref(false)
const dialogoSubirFoto      = ref(false)
const fotoPreview           = ref(null)
const errorFoto             = ref('')
const guardandoFoto         = ref(false)
const fileInputRef          = ref(null)
const guardandoPassword = ref(false)

const formPassword = ref({ current: '', nueva: '', confirmar: '' })
const erroresPassword = ref({ current: '', nueva: '', confirmar: '' })
const showCurrent  = ref(false)
const showNueva    = ref(false)
const showConfirmar = ref(false)

// ── Computed ──────────────────────────────────────────────
const esAdmin = computed(() => auth.hasRole('administrador'))

const isProfesorActive = computed(() =>
  isActive('ProfesorSesion') ||
  isActive('PasarAsistencia') ||
  isActive('RegistrarNotas') ||
  isActive('ProfesorHistorial')
)

// ── Helpers ───────────────────────────────────────────────
function isActive(routeName) {
  return route.name === routeName
}

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function cerrarDrawerMobile() {
  if ($q.screen.lt.md) drawer.value = false
}

function cerrarSesion() {
  auth.logout()
  router.push({ name: 'Login' })
}

// ── Sidebar: pin (fija/desfija el modo expandido permanentemente) ─────────
function togglePin() {
  sidebarPinned.value = !sidebarPinned.value
  miniState.value = !sidebarPinned.value
  localStorage.setItem('pdv-sidebar-pinned', JSON.stringify(sidebarPinned.value))
}

// ── Sidebar: hamburguesa ──────────────────────────────────────────────────
// Desktop: toggle manual mini↔expandido (overlay temporal, no toca el pin).
// Mobile: abre/cierra el drawer.
function toggleHamburger() {
  if ($q.screen.lt.md) {
    drawer.value = !drawer.value
  } else {
    miniState.value = !miniState.value
  }
}

// ── Subir foto ────────────────────────────────────────────
function abrirSubirFoto() {
  dialogoSubirFoto.value = true
}

function resetSubirFoto() {
  fotoPreview.value = null
  errorFoto.value = ''
  guardandoFoto.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onArchivoSeleccionado(event) {
  errorFoto.value = ''
  const file = event.target.files?.[0]
  if (!file) return

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type)) {
    errorFoto.value = 'Solo se aceptan imágenes JPEG, PNG o WebP.'
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    errorFoto.value = 'La imagen supera el límite de 2 MB.'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => { fotoPreview.value = e.target.result }
  reader.readAsDataURL(file)
}

async function guardarFoto() {
  if (!fotoPreview.value || errorFoto.value) return
  guardandoFoto.value = true
  try {
    const { data } = await api.patch('/users/me/avatar', { avatar: fotoPreview.value })
    auth.updateUser({ avatar: data.avatar })
    $q.notify({ type: 'positive', message: 'Foto de perfil actualizada.', position: 'top' })
    dialogoSubirFoto.value = false
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la foto.', position: 'top' })
  } finally {
    guardandoFoto.value = false
  }
}

function eliminarFoto() {
  $q.dialog({
    title: 'Eliminar foto de perfil',
    message: 'Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar tu foto?',
    cancel: { flat: true, label: 'Cancelar', color: 'grey-7' },
    ok: { unelevated: true, label: 'Eliminar', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete('/users/me/avatar')
      auth.updateUser({ avatar: null })
      $q.notify({ type: 'positive', message: 'Foto de perfil eliminada.', position: 'top' })
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo eliminar la foto.', position: 'top' })
    }
  })
}

// ── Cambio de contraseña ──────────────────────────────────
function abrirCambioPassword() {
  dialogoCambioPassword.value = true
}

function resetFormPassword() {
  formPassword.value = { current: '', nueva: '', confirmar: '' }
  erroresPassword.value = { current: '', nueva: '', confirmar: '' }
  showCurrent.value = false
  showNueva.value = false
  showConfirmar.value = false
}

function validarPassword() {
  const e = { current: '', nueva: '', confirmar: '' }
  let ok = true

  if (!formPassword.value.current) {
    e.current = 'Ingresa tu contraseña actual'
    ok = false
  }
  if (formPassword.value.nueva.length < 3) {
    e.nueva = 'La contraseña debe tener al menos 3 caracteres'
    ok = false
  }
  if (formPassword.value.nueva !== formPassword.value.confirmar) {
    e.confirmar = 'Las contraseñas no coinciden'
    ok = false
  }

  erroresPassword.value = e
  return ok
}

async function guardarPassword() {
  if (!validarPassword()) return

  guardandoPassword.value = true
  try {
    await api.patch('/auth/change-password', {
      currentPassword: formPassword.value.current,
      newPassword: formPassword.value.nueva,
    })
    $q.notify({ type: 'positive', message: 'Contraseña actualizada correctamente.', position: 'top' })
    dialogoCambioPassword.value = false
  } catch (err) {
    const status = err.response?.status
    if (status === 401 || status === 403) {
      erroresPassword.value.current = 'Contraseña actual incorrecta'
    } else {
      $q.notify({ type: 'negative', message: 'No se pudo cambiar la contraseña.', position: 'top' })
    }
  } finally {
    guardandoPassword.value = false
  }
}
</script>

<style scoped>
/* ── Topbar: bloque usuario ── */
.topbar-avatar {
  background: #0D1B3E;
  color: #FFFFFF;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ── Dialog subir foto ── */
.foto-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  background: #F1F5F9;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #CBD5E1;
}

.foto-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.foto-preview-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.user-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px 5px 6px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  user-select: none;
}

.user-block:hover {
  background: #F1F5F9;
}

.user-name {
  color: #1E293B;
  font-size: 13px;
  font-weight: 600;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

/* ── QMenu usuario ── */
.user-menu {
  padding: 4px 0;
}

.user-menu-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 14px;
}

.user-menu-item {
  padding: 8px 16px;
  min-height: 40px;
  border-radius: 0;
}

/* ── Sidebar: franja superior con logo + hamburguesa ── */
.sidebar-brand {
  height: 64px;
  min-height: 64px;
  display: flex;
  align-items: center;
  padding: 0 12px 0 16px;
  flex-shrink: 0;
  overflow: hidden;
  gap: 8px;
}

.sidebar-brand-logo {
  flex: 1;
  height: 38px;
  min-width: 0;
  object-fit: contain;
  object-position: left center;
}

/* Mini: espiga centrada */
.sidebar-brand--mini {
  justify-content: center;
  padding: 0;
}

.sidebar-brand-espiga {
  width: 38px;
  height: 38px;
  object-fit: contain;
  cursor: pointer;
  opacity: 0.88;
  transition: opacity 0.15s;
}

.sidebar-brand-espiga:hover {
  opacity: 1;
}

/* ── Sidebar: íconos ── */
.sidebar-icon-col {
  min-width: 48px !important;
  align-items: center !important;
  padding-right: 0 !important;
}

/* ── Sidebar: ítems ── */
.sidebar-item {
  width: 100%;
  min-height: 48px;
  border-radius: 10px;
  padding: 0;
  transition: background 0.2s;
  position: relative;
}

.sidebar-item-active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 22px;
  background: #FFFFFF;
  border-radius: 0 3px 3px 0;
}

.sidebar-item-active {
  background: rgba(255, 255, 255, 0.12) !important;
}

.sidebar-item:hover:not(.sidebar-item-active) {
  background: rgba(255, 255, 255, 0.07) !important;
}

/* ── Sidebar: etiquetas en modo expandido ── */
.sidebar-label {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Sidebar: divisores ── */
.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 6px 0;
}
</style>

<style>
/* Sin scoped: tooltips renderizan en portal fuera del componente */
.pdv-tooltip {
  background: #0B1835 !important;
  color: white !important;
  border-radius: 6px !important;
  font-size: 12px !important;
  padding: 5px 10px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.35) !important;
}
</style>
