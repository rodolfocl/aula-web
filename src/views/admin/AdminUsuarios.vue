<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div style="color: #0D1B3E; font-size: 20px; font-weight: 700;">Gestión de Usuarios</div>
      <div style="position: relative; display: inline-flex;">
        <q-btn
          unelevated icon="add" label="Nuevo usuario"
          :style="isAdmin
            ? 'background: #0D1B3E; color: white; border-radius: 8px;'
            : 'background: #E2E8F0; color: #94A3B8; border-radius: 8px; pointer-events: none;'"
          @click="abrirDialogo()"
        />
        <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
          <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear</q-tooltip>
        </div>
      </div>
    </div>

    <q-card class="pdv-table" style="background: white; border-radius: 14px; box-shadow: var(--pdv-shadow-card);">
      <q-table
        :rows="usuarios"
        :columns="columnas"
        row-key="id"
        flat
        :filter="filtro"
        :loading="cargando"
        :pagination="{ rowsPerPage: 15 }"
        :rows-per-page-options="[5, 10, 15, 25, 50, 0]"
        :grid="$q.screen.lt.sm"
      >
        <template #top-left>
          <q-toggle
            v-model="mostrarInactivos"
            label="Mostrar inactivos"
            color="primary"
            style="font-size: 13px; color: #64748B;"
          />
        </template>

        <template #top-right>
          <q-input
            v-model="filtro" outlined dense placeholder="Buscar..." clearable
            style="min-width: 200px;"
          >
            <template #prepend><q-icon name="search" color="grey-5" /></template>
          </q-input>
        </template>

        <!-- ── Columna nombre con avatar ── -->
        <template #body-cell-full_name="props">
          <q-td :props="props">
            <div class="row items-center no-wrap" style="gap: 10px;">
              <div class="pdv-avatar pdv-avatar-sm">{{ iniciales(props.row.full_name) }}</div>
              <span :style="props.row.active === false ? 'color: #94A3B8;' : 'color: #0D1B3E; font-weight: 500;'">
                {{ props.row.full_name }}
              </span>
            </div>
          </q-td>
        </template>

        <!-- ── Columna roles ── -->
        <template #body-cell-roles="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <span
                v-for="rol in (props.value || [])"
                :key="rol"
                class="pdv-pill pdv-pill-navy"
                style="text-transform: capitalize;"
              >{{ rol }}</span>
            </div>
          </q-td>
        </template>

        <!-- ── Columna estado ── -->
        <template #body-cell-active="props">
          <q-td :props="props" style="text-align: center;">
            <span :class="['pdv-pill', props.value ? 'pdv-pill-success' : 'pdv-pill-error']">
              {{ props.value ? 'Activo' : 'Inactivo' }}
            </span>
          </q-td>
        </template>

        <!-- ── Columna acciones ── -->
        <template #body-cell-acciones="props">
          <q-td :props="props">
            <div class="row items-center no-wrap" style="gap: 6px; justify-content: center;">

              <!-- Editar -->
              <div style="position: relative; display: inline-flex;">
                <button
                  class="pdv-action-btn pdv-action-blue"
                  :class="{ 'pdv-action-disabled': !isAdmin }"
                  @click="abrirDialogo(props.row)"
                >
                  <q-icon name="edit" size="16px" />
                </button>
                <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                  <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
                </div>
              </div>

              <!-- Reactivar (solo si inactivo) -->
              <template v-if="props.row.active === false">
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn pdv-action-success"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="reactivar(props.row)"
                  >
                    <q-icon name="person_add" size="16px" />
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden reactivar</q-tooltip>
                  </div>
                  <q-tooltip v-if="isAdmin" class="pdv-tooltip">Reactivar usuario</q-tooltip>
                </div>
              </template>

              <!-- Desactivar (solo si activo) -->
              <template v-else>
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn pdv-action-danger"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="pedirDesactivar(props.row)"
                  >
                    <q-icon name="person_off" size="16px" />
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden desactivar</q-tooltip>
                  </div>
                </div>
              </template>

            </div>
          </q-td>
        </template>

        <!-- ── Vista móvil (grid mode) ── -->
        <template #item="props">
          <div class="col-12 q-pa-xs">
            <q-card style="border-radius: 12px; box-shadow: var(--pdv-shadow-card); background: white;">
              <q-card-section style="padding: 14px 16px;">

                <div class="row items-center no-wrap" style="gap: 12px; margin-bottom: 10px;">
                  <div class="pdv-avatar pdv-avatar-md">{{ iniciales(props.row.full_name) }}</div>
                  <div style="flex: 1; min-width: 0;">
                    <div :style="props.row.active === false ? 'color: #94A3B8; font-weight: 600;' : 'color: #0D1B3E; font-weight: 600;'" style="font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ props.row.full_name }}
                    </div>
                    <div style="font-size: 12px; color: #64748B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ props.row.email }}</div>
                  </div>
                  <span :class="['pdv-pill', props.row.active ? 'pdv-pill-success' : 'pdv-pill-error']">
                    {{ props.row.active ? 'Activo' : 'Inactivo' }}
                  </span>
                </div>

                <div class="row items-center justify-between" style="gap: 8px;">
                  <div class="row q-gutter-xs">
                    <span
                      v-for="rol in (props.row.roles || [])"
                      :key="rol"
                      class="pdv-pill pdv-pill-navy"
                      style="text-transform: capitalize;"
                    >{{ rol }}</span>
                  </div>
                  <div class="row items-center no-wrap" style="gap: 6px;">
                    <div style="position: relative; display: inline-flex;">
                      <button class="pdv-action-btn pdv-action-blue" :class="{ 'pdv-action-disabled': !isAdmin }" @click="abrirDialogo(props.row)">
                        <q-icon name="edit" size="16px" />
                      </button>
                      <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                        <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
                      </div>
                    </div>
                    <template v-if="props.row.active === false">
                      <div style="position: relative; display: inline-flex;">
                        <button class="pdv-action-btn pdv-action-success" :class="{ 'pdv-action-disabled': !isAdmin }" @click="reactivar(props.row)">
                          <q-icon name="person_add" size="16px" />
                        </button>
                        <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                          <q-tooltip class="pdv-tooltip">Solo los administradores pueden reactivar</q-tooltip>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div style="position: relative; display: inline-flex;">
                        <button class="pdv-action-btn pdv-action-danger" :class="{ 'pdv-action-disabled': !isAdmin }" @click="pedirDesactivar(props.row)">
                          <q-icon name="person_off" size="16px" />
                        </button>
                        <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                          <q-tooltip class="pdv-tooltip">Solo los administradores pueden desactivar</q-tooltip>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

              </q-card-section>
            </q-card>
          </div>
        </template>

        <template #no-data>
          <EmptyState icon="👥" message="No hay usuarios registrados" />
        </template>
        <template #no-results>
          <EmptyState icon="🔍" message="No se encontraron usuarios con ese criterio" />
        </template>
        <template #loading>
          <q-inner-loading showing>
            <q-spinner-dots color="primary" size="40px" />
          </q-inner-loading>
        </template>
      </q-table>
    </q-card>

    <!-- ── Modal crear / editar ── -->
    <q-dialog v-model="dialogo" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important;' : ''">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.full_name" label="Nombre completo" />
          <q-input v-model="form.email" label="Correo electrónico" type="email" />
          <q-input
            v-if="!editando"
            v-model="form.password"
            label="Contraseña temporal"
            type="password"
          />
          <div>
            <div style="font-size: 13px; color: #64748B; margin-bottom: 8px;">Roles</div>
            <q-option-group
              v-model="form.roles"
              :options="opcionesRoles"
              type="checkbox"
              color="primary"
              style="color: #0D1B3E;"
            />
          </div>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" class="pdv-btn-save" :loading="guardando" @click="guardar" />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── Modal confirmar desactivar ── -->
    <q-dialog v-model="dialogoDesactivar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Desactivar usuario</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Desactivar a <strong>{{ usuarioADesactivar?.full_name }}</strong>?
            El usuario no podrá iniciar sesión pero su historial se conserva.
          </p>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Desactivar" :loading="procesando"
            style="background: #991B1B; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
            @click="confirmarDesactivar"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { usePermissions } from '../../composables/usePermissions'
import EmptyState from '../../components/EmptyState.vue'

const $q = useQuasar()
const auth = useAuthStore()
const { isAdmin } = usePermissions()

const filtro = ref('')
const mostrarInactivos = ref(false)
const dialogo = ref(false)
const editando = ref(null)
const cargando = ref(false)
const guardando = ref(false)
const dialogoDesactivar = ref(false)
const usuarioADesactivar = ref(null)
const procesando = ref(false)

const opcionesRoles = [
  { label: 'Alumno', value: 'alumno' },
  { label: 'Profesor', value: 'profesor' },
  { label: 'Administrador', value: 'administrador' },
]

const columnas = [
  { name: 'full_name', label: 'Nombre', field: 'full_name', align: 'left', sortable: true },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left' },
  { name: 'active', label: 'Estado', field: 'active', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const usuarios = ref([])
const form = ref({ full_name: '', email: '', password: '', roles: [] })

function iniciales(nombre) {
  return (nombre ?? '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

async function cargarUsuarios() {
  cargando.value = true
  try {
    const params = mostrarInactivos.value ? { includeInactive: true } : {}
    const { data } = await api.get('/users', { params })
    usuarios.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de usuarios.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

onMounted(cargarUsuarios)
watch(mostrarInactivos, cargarUsuarios)

function abrirDialogo(usuario = null) {
  editando.value = usuario
  form.value = usuario
    ? { full_name: usuario.full_name, email: usuario.email, password: '', roles: [...(usuario.roles || [])] }
    : { full_name: '', email: '', password: '', roles: [] }
  dialogo.value = true
}

async function guardar() {
  guardando.value = true
  try {
    if (editando.value) {
      const payload = { full_name: form.value.full_name, email: form.value.email, roles: form.value.roles }
      await api.patch(`/users/${editando.value.id}`, payload)
      if (editando.value.id === auth.user?.id) {
        const { data: freshUser } = await api.get(`/users/${editando.value.id}`)
        auth.updateUser(freshUser)
        Object.assign(editando.value, freshUser)
      } else {
        Object.assign(editando.value, payload)
      }
      $q.notify({ type: 'positive', message: 'Usuario actualizado.', position: 'top' })
    } else {
      const { data } = await api.post('/auth/register', {
        full_name: form.value.full_name,
        email: form.value.email,
        password: form.value.password,
        roles: form.value.roles,
      })
      usuarios.value.push(data)
      $q.notify({ type: 'positive', message: 'Usuario creado.', position: 'top' })
    }
    dialogo.value = false
  } catch (err) {
    const status = err.response?.status
    if (status === 409) {
      $q.notify({ type: 'negative', message: 'Ya existe un usuario con ese correo.', position: 'top' })
    } else {
      $q.notify({ type: 'negative', message: 'No se pudo guardar el usuario.', position: 'top' })
    }
  } finally {
    guardando.value = false
  }
}

function pedirDesactivar(usuario) {
  if (usuario.id === auth.user?.id) {
    $q.notify({ type: 'warning', message: 'No puedes desactivar tu propio usuario.', position: 'top' })
    return
  }
  usuarioADesactivar.value = usuario
  dialogoDesactivar.value = true
}

async function confirmarDesactivar() {
  procesando.value = true
  try {
    await api.patch(`/users/${usuarioADesactivar.value.id}`, { active: false })
    await cargarUsuarios()
    dialogoDesactivar.value = false
    $q.notify({ type: 'positive', message: 'Usuario desactivado.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo desactivar el usuario.', position: 'top' })
  } finally {
    procesando.value = false
  }
}

async function reactivar(usuario) {
  try {
    await api.patch(`/users/${usuario.id}`, { active: true })
    await cargarUsuarios()
    $q.notify({ type: 'positive', message: 'Usuario reactivado.', position: 'top' })
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo reactivar el usuario.', position: 'top' })
  }
}
</script>