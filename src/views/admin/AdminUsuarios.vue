<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Usuarios</div>
      <div style="position: relative; display: inline-flex;">
        <q-btn
          unelevated
          icon="add"
          label="Nuevo usuario"
          :style="isAdmin ? 'background: #0D1B3E; color: white; border-radius: 8px;' : 'background: #CCCCCC; color: #888888; border-radius: 8px; opacity: 0.5; pointer-events: none;'"
          @click="abrirDialogo()"
        />
        <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
          <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear</q-tooltip>
        </div>
      </div>
    </div>

    <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
      <q-table
        :rows="usuarios"
        :columns="columnas"
        row-key="id"
        flat
        :filter="filtro"
        :loading="cargando"
        :pagination="{ rowsPerPage: 15 }"
        :rows-per-page-options="[5, 10, 15, 25, 50, 0]"
      >
        <template #top-left>
          <q-toggle
            v-model="mostrarInactivos"
            label="Mostrar inactivos"
            color="primary"
            style="font-size: 13px; color: #555555;"
          />
        </template>

        <template #top-right>
          <q-input v-model="filtro" outlined dense placeholder="Buscar..." clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </template>

        <template #body-cell-full_name="props">
          <q-td :props="props">
            <span :style="props.row.active === false ? 'color: #AAAAAA;' : 'color: #0D1B3E;'">
              {{ props.row.full_name }}
            </span>
          </q-td>
        </template>

        <template #body-cell-roles="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-badge
                v-for="rol in (props.value || [])"
                :key="rol"
                style="background: rgba(13,27,62,0.10); color: #0D1B3E; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: capitalize;"
              >
                {{ rol }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template #body-cell-active="props">
          <q-td :props="props">
            <q-badge
              :style="props.value
                ? 'background: #E8F5E9; color: #1B5E20; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
                : 'background: #FFEBEE; color: #7F0000; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'"
            >
              {{ props.value ? 'Activo' : 'Inactivo' }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-xs">
            <!-- Editar -->
            <div style="position: relative; display: inline-flex;">
              <q-btn
                flat round dense icon="edit" size="sm"
                :style="isAdmin ? 'color: #1565C0;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                @click="abrirDialogo(props.row)"
              />
              <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
              </div>
            </div>

            <!-- Reactivar (solo si inactivo) -->
            <template v-if="props.row.active === false">
              <div style="position: relative; display: inline-flex;">
                <q-btn
                  flat round dense icon="person_add" size="sm"
                  :style="isAdmin ? 'color: #2E7D32;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                  @click="reactivar(props.row)"
                >
                  <q-tooltip class="pdv-tooltip">Reactivar usuario</q-tooltip>
                </q-btn>
                <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                  <q-tooltip class="pdv-tooltip">Solo los administradores pueden reactivar</q-tooltip>
                </div>
              </div>
            </template>

            <!-- Desactivar (solo si activo) -->
            <template v-else>
              <div style="position: relative; display: inline-flex;">
                <q-btn
                  flat round dense icon="person_off" size="sm"
                  :style="isAdmin ? 'color: #C0392B;' : 'color: #AAAAAA; opacity: 0.5; pointer-events: none;'"
                  @click="pedirDesactivar(props.row)"
                />
                <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                  <q-tooltip class="pdv-tooltip">Solo los administradores pueden desactivar</q-tooltip>
                </div>
              </div>
            </template>
          </q-td>
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

    <!-- Modal crear / editar -->
    <q-dialog v-model="dialogo">
      <q-card class="pdv-dialog">
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
            <div style="font-size: 13px; color: #555555; margin-bottom: 8px;">Roles</div>
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

    <!-- Modal confirmar desactivar -->
    <q-dialog v-model="dialogoDesactivar">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title" style="color: #C0392B;">Desactivar usuario</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Desactivar a <strong>{{ usuarioADesactivar?.full_name }}</strong>?
            El usuario no podrá iniciar sesión pero su historial se conserva.
          </p>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated
            label="Desactivar"
            :loading="procesando"
            style="background: #C0392B; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
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

<style>
.pdv-tooltip {
  background: #0D1B3E;
  color: white;
  font-size: 12px;
  border-radius: 6px;
  padding: 4px 10px;
}
</style>