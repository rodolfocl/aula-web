<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Usuarios</div>
      <q-btn
        unelevated
        icon="add"
        label="Nuevo usuario"
        style="background: #0D1B3E; color: white; border-radius: 8px;"
        @click="abrirDialogo()"
      />
    </div>

    <q-card flat style="background: white; border-radius: 12px; border: 1px solid #E8D5B0; overflow: hidden;">
      <q-table
        :rows="usuarios"
        :columns="columnas"
        row-key="id"
        flat
        :filter="filtro"
        :loading="cargando"
        no-data-label="No hay usuarios registrados"
      >
        <template #top-right>
          <q-input v-model="filtro" outlined dense placeholder="Buscar..." clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
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
            <q-btn flat round dense icon="edit" color="primary" size="sm" @click="abrirDialogo(props.row)" />
            <q-btn flat round dense icon="delete" color="negative" size="sm" @click="eliminar(props.row)" />
          </q-td>
        </template>

        <template #loading>
          <q-inner-loading showing>
            <q-spinner-dots color="primary" size="40px" />
          </q-inner-loading>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.full_name" label="Nombre completo" outlined dense />
          <q-input v-model="form.email" label="Correo electrónico" type="email" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn unelevated label="Guardar" style="background: #0D1B3E; color: white;" @click="guardar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'

const $q = useQuasar()
const filtro = ref('')
const dialogo = ref(false)
const editando = ref(null)
const cargando = ref(false)

const columnas = [
  { name: 'full_name', label: 'Nombre', field: 'full_name', align: 'left', sortable: true },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' },
  { name: 'active', label: 'Estado', field: 'active', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const usuarios = ref([])
const form = ref({ full_name: '', email: '' })

onMounted(async () => {
  cargando.value = true
  try {
    const { data } = await api.get('/users')
    usuarios.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de usuarios.', position: 'top' })
  } finally {
    cargando.value = false
  }
})

function abrirDialogo(usuario = null) {
  editando.value = usuario
  form.value = usuario
    ? { full_name: usuario.full_name, email: usuario.email }
    : { full_name: '', email: '' }
  dialogo.value = true
}

function guardar() {
  if (editando.value) {
    Object.assign(editando.value, form.value)
    $q.notify({ type: 'positive', message: 'Usuario actualizado.', position: 'top' })
  } else {
    usuarios.value.push({ id: Date.now(), ...form.value, active: true })
    $q.notify({ type: 'positive', message: 'Usuario creado.', position: 'top' })
  }
  dialogo.value = false
}

function eliminar(usuario) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Eliminar a ${usuario.full_name}?`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(() => {
    usuarios.value = usuarios.value.filter(u => u.id !== usuario.id)
    $q.notify({ type: 'negative', message: 'Usuario eliminado.', position: 'top' })
  })
}
</script>