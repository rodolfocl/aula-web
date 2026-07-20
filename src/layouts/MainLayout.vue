<template>
  <q-layout view="lHh Lpr lFf">

    <!-- ── TOPBAR ──────────────────────────────────────────── -->
    <q-header style="background: #FFFFFF; box-shadow: var(--pdv-shadow-topbar); min-height: 64px;">
      <q-toolbar style="min-height: 64px; padding: 0 16px 0 8px;">

        <!-- Hamburger — solo en mobile -->
        <q-btn
          v-if="$q.screen.lt.md"
          flat round dense icon="menu"
          color="grey-7" class="q-mr-xs"
          @click="drawer = !drawer"
        />

        <!-- Logo -->
        <q-toolbar-title shrink style="min-width: 0; padding: 0 12px 0 4px;">
          <img :src="logoImg" alt="Aula PDV"
            style="height: 52px; width: auto; object-fit: contain; display: block;" />
        </q-toolbar-title>

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
              <!-- Header del menú -->
              <div class="user-menu-header">
                <div style="min-width: 0; flex: 1;">
                  <div style="font-weight: 700; font-size: 15px; color: #13224A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ auth.user?.full_name ?? auth.user?.nombre }}
                  </div>
                  <div style="font-size: 12px; color: #9AA0AB; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ auth.user?.email }}
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: #C99A63; text-transform: capitalize; margin-top: 3px;">
                    {{ esAdmin ? 'Administrador' : (auth.userRoles.join(' · ') || '—') }}
                  </div>
                </div>
                <button class="umenu-edit-btn" @click.stop="abrirEditarPerfil">
                  <i class="ti ti-pencil" style="font-size: 14px;" />
                  <q-tooltip class="pdv-tooltip" anchor="bottom middle" self="top middle">Editar perfil</q-tooltip>
                </button>
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

              <!-- Eliminar foto -->
              <q-item
                class="user-menu-item"
                :clickable="!!auth.user?.avatar"
                v-ripple
                :style="!auth.user?.avatar ? 'opacity: 0.38; cursor: default; pointer-events: none;' : ''"
                @click="auth.user?.avatar && eliminarFoto()"
              >
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
      :width="64"
      style="background: #0B1835;"
    >
      <div class="column items-center" style="padding-top: 64px; height: 100%;">
        <div class="sidebar-divider" style="margin-top: 12px; margin-bottom: 8px;" />

        <div class="column items-center" style="width: 64px; gap: 2px;">

          <!-- Inicio (todos los roles) -->
          <q-item
            clickable v-ripple
            :to="{ name: 'Inicio' }"
            class="sidebar-item"
            :class="{ 'sidebar-item-active': isActive('Inicio') }"
            @click="cerrarDrawerMobile"
          >
            <i class="ti ti-home"
              :style="`font-size: 22px; color: ${isActive('Inicio') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
            <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
              Inicio
            </q-tooltip>
          </q-item>

          <div class="sidebar-divider" />

          <template v-if="auth.hasRole('profesor') || auth.hasRole('administrador')">
            <q-item
              clickable v-ripple
              :to="{ name: 'ProfesorSesion' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isProfesorActive }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-chalkboard"
                :style="`font-size: 22px; color: ${isProfesorActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Clases
              </q-tooltip>
            </q-item>
          </template>

          <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'Calendario' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('Calendario') }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-calendar"
                :style="`font-size: 22px; color: ${isActive('Calendario') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Calendario
              </q-tooltip>
            </q-item>
          </template>

          <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'Archivos' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isArchivosActive }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-folder"
                :style="`font-size: 22px; color: ${isArchivosActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Archivos
              </q-tooltip>
            </q-item>
          </template>

          <template v-if="auth.hasRole('administrador') || auth.hasRole('profesor')">
            <q-item
              clickable v-ripple
              :to="{ name: 'AdminUsuarios' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminUsuarios') }"
              @click="cerrarDrawerMobile"
            >
              <q-icon name="people" size="22px"
                :style="{ color: isActive('AdminUsuarios') ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
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
              <i class="ti ti-books"
                :style="`font-size: 22px; color: ${isActive('AdminCursos') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Plantilla de Cursos
              </q-tooltip>
            </q-item>

          </template>

          <template v-if="esPropietarioGoogle">
            <q-item
              clickable v-ripple
              :to="{ name: 'AdminIntegraciones' }"
              class="sidebar-item"
              :class="{ 'sidebar-item-active': isActive('AdminIntegraciones') }"
              @click="cerrarDrawerMobile"
            >
              <i class="ti ti-plug-connected"
                :style="`font-size: 22px; color: ${isActive('AdminIntegraciones') ? '#FFFFFF' : 'rgba(255,255,255,0.65)'};`" />
              <q-tooltip anchor="center right" self="center left" :offset="[12, 0]" class="pdv-tooltip">
                Integraciones
              </q-tooltip>
            </q-item>
          </template>

        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive :include="['DashboardProfesor']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
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

    <!-- ── DIÁLOGO: Editar perfil ────────────────────────────── -->
    <q-dialog v-model="dialogoEditarPerfil" :maximized="$q.screen.lt.sm" @hide="resetEditarPerfil">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : 'min-width: 400px;'">
        <div class="pdv-dialog-title">Editar perfil</div>
        <div class="pdv-dialog-body">
          <q-input
            v-model="formPerfil.nombre"
            label="Nombre completo"
            outlined dense
            autofocus
            maxlength="100"
            :error="!!erroresPerfil.nombre"
            :error-message="erroresPerfil.nombre"
            :disable="guardandoPerfil"
            @keyup.esc="dialogoEditarPerfil = false"
          />
          <q-input
            v-model="formPerfil.email"
            label="Correo electrónico"
            type="email"
            outlined dense
            maxlength="150"
            :error="!!erroresPerfil.email"
            :error-message="erroresPerfil.email"
            :disable="guardandoPerfil"
            @keyup.esc="dialogoEditarPerfil = false"
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" :disable="guardandoPerfil" />
          <q-btn
            unelevated label="Guardar cambios" class="pdv-btn-save"
            :loading="guardandoPerfil"
            @click="guardarPerfil"
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
import { isOwner } from '../config/owner'

const router = useRouter()
const route  = useRoute()
const $q     = useQuasar()
const auth   = useAuthStore()
const drawer = ref(true)

// ── Refs de UI ────────────────────────────────────────────
const dialogoCambioPassword = ref(false)
const dialogoEditarPerfil = ref(false)
const formPerfil          = ref({ nombre: '', email: '' })
const erroresPerfil       = ref({ nombre: '', email: '' })
const guardandoPerfil     = ref(false)
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
const esPropietarioGoogle = computed(() => isOwner(auth.user?.email))

const isProfesorActive = computed(() =>
  isActive('ProfesorSesion') ||
  isActive('PasarAsistencia') ||
  isActive('RegistrarNotas') ||
  isActive('ProfesorHistorial')
)

const isArchivosActive = computed(() => isActive('Archivos'))

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

// ── Editar perfil ─────────────────────────────────────────
function abrirEditarPerfil() {
  formPerfil.value  = {
    nombre: auth.user?.full_name ?? auth.user?.nombre ?? '',
    email:  auth.user?.email ?? '',
  }
  erroresPerfil.value = { nombre: '', email: '' }
  dialogoEditarPerfil.value = true
}

function resetEditarPerfil() {
  formPerfil.value    = { nombre: '', email: '' }
  erroresPerfil.value = { nombre: '', email: '' }
  guardandoPerfil.value = false
}

async function guardarPerfil() {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  erroresPerfil.value = { nombre: '', email: '' }
  let valido = true

  const nombre = formPerfil.value.nombre.trim()
  const email  = formPerfil.value.email.trim().toLowerCase()

  if (!nombre) {
    erroresPerfil.value.nombre = 'El nombre no puede estar vacío.'
    valido = false
  } else if (nombre.length > 100) {
    erroresPerfil.value.nombre = 'Máximo 100 caracteres.'
    valido = false
  }

  if (!email) {
    erroresPerfil.value.email = 'El correo no puede estar vacío.'
    valido = false
  } else if (!EMAIL_RE.test(email)) {
    erroresPerfil.value.email = 'Ingresa un correo electrónico válido.'
    valido = false
  } else if (email.length > 150) {
    erroresPerfil.value.email = 'Máximo 150 caracteres.'
    valido = false
  }

  if (!valido) return

  const payload = {}
  if (nombre !== (auth.user?.full_name ?? auth.user?.nombre ?? '').trim()) payload.full_name = nombre
  if (email  !== (auth.user?.email ?? '').toLowerCase())                   payload.email     = email

  if (!Object.keys(payload).length) {
    dialogoEditarPerfil.value = false
    return
  }

  guardandoPerfil.value = true
  try {
    const { data } = await api.patch('/users/me', payload)
    auth.updateUser({ full_name: data.full_name, email: data.email })
    $q.notify({ type: 'positive', message: 'Perfil actualizado correctamente.', position: 'top' })
    dialogoEditarPerfil.value = false
  } catch (err) {
    const status = err.response?.status
    const msg    = err.response?.data?.message
    if (status === 409) {
      erroresPerfil.value.email = 'Este correo ya está registrado por otro usuario.'
    } else {
      $q.notify({ type: 'negative', message: msg || 'No se pudo guardar el perfil.', position: 'top' })
    }
  } finally {
    guardandoPerfil.value = false
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

.umenu-edit-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #E7E9EE;
  background: transparent;
  color: #9AA0AB;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.umenu-edit-btn:hover {
  background: #F1F5F9;
  color: #13224A;
  border-color: #C5CCD8;
}

.user-menu-item {
  padding: 8px 16px;
  min-height: 40px;
  border-radius: 0;
}

/* ── Sidebar ── */
.sidebar-item {
  width: 48px;
  min-height: 48px;
  border-radius: 10px;
  margin: 1px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.sidebar-divider {
  width: 32px;
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
