<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-primary">Gestión de Usuarios</div>
      <q-btn color="primary" icon="add" label="Nuevo usuario" unelevated @click="abrirDialogo()" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="usuarios"
        :columns="columnas"
        row-key="id"
        flat
        :filter="filtro"
      >
        <template #top-right>
          <q-input v-model="filtro" outlined dense placeholder="Buscar..." clearable>
            <template #prepend><q-icon name="search" /></template>
          </q-input>
        </template>

        <template #body-cell-rol="props">
          <q-td :props="props">
            <q-badge :color="colorRol[props.value]">{{ props.value }}</q-badge>
          </q-td>
        </template>

        <template #body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn flat round dense icon="edit" color="primary" size="sm" @click="abrirDialogo(props.row)" />
            <q-btn flat round dense icon="delete" color="negative" size="sm" @click="eliminar(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nombre" label="Nombre completo" outlined dense />
          <q-input v-model="form.email" label="Correo electrónico" type="email" outlined dense />
          <q-select v-model="form.rol" label="Rol" :options="['alumno', 'profesor', 'admin']" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="primary" label="Guardar" unelevated @click="guardar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const filtro = ref('')
const dialogo = ref(false)
const editando = ref(null)

const colorRol = { alumno: 'secondary', profesor: 'primary', admin: 'accent' }

const columnas = [
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'email', label: 'Correo', field: 'email', align: 'left' },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const usuarios = ref([
  { id: 1, nombre: 'María González', email: 'alumno@pdv.cl', rol: 'alumno' },
  { id: 2, nombre: 'Carlos Muñoz', email: 'profesor@pdv.cl', rol: 'profesor' },
  { id: 3, nombre: 'Ana Torres', email: 'admin@pdv.cl', rol: 'admin' },
])

const form = ref({ nombre: '', email: '', rol: 'alumno' })

function abrirDialogo(usuario = null) {
  editando.value = usuario
  form.value = usuario
    ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    : { nombre: '', email: '', rol: 'alumno' }
  dialogo.value = true
}

function guardar() {
  if (editando.value) {
    Object.assign(editando.value, form.value)
    $q.notify({ type: 'positive', message: 'Usuario actualizado.' })
  } else {
    usuarios.value.push({ id: Date.now(), ...form.value })
    $q.notify({ type: 'positive', message: 'Usuario creado.' })
  }
  dialogo.value = false
}

function eliminar(usuario) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Eliminar a ${usuario.nombre}?`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(() => {
    usuarios.value = usuarios.value.filter(u => u.id !== usuario.id)
    $q.notify({ type: 'negative', message: 'Usuario eliminado.' })
  })
}
</script>