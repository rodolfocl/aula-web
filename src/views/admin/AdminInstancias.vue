<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-primary">Gestión de Instancias</div>
      <q-btn color="primary" icon="add" label="Nueva instancia" unelevated @click="abrirDialogo()" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="instancias"
        :columns="columnas"
        row-key="id"
        flat
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge :color="props.value === 'activa' ? 'positive' : 'grey'">
              {{ props.value }}
            </q-badge>
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
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar Instancia' : 'Nueva Instancia' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-select v-model="form.curso" label="Curso" :options="nombresCursos" outlined dense />
          <q-input v-model="form.periodo" label="Período (ej: 2026-1)" outlined dense />
          <q-input v-model="form.fechaInicio" label="Fecha inicio" type="date" outlined dense />
          <q-input v-model="form.fechaFin" label="Fecha fin" type="date" outlined dense />
          <q-select v-model="form.estado" label="Estado" :options="['activa', 'cerrada']" outlined dense />
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
const dialogo = ref(false)
const editando = ref(null)

const nombresCursos = ['Teología Bíblica II', 'Hermenéutica Avanzada', 'Griego Bíblico', 'Homilética I']

const columnas = [
  { name: 'curso', label: 'Curso', field: 'curso', align: 'left', sortable: true },
  { name: 'periodo', label: 'Período', field: 'periodo', align: 'center' },
  { name: 'fechaInicio', label: 'Inicio', field: 'fechaInicio', align: 'center' },
  { name: 'fechaFin', label: 'Fin', field: 'fechaFin', align: 'center' },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center' },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center' },
]

const instancias = ref([
  { id: 1, curso: 'Teología Bíblica II', periodo: '2026-1', fechaInicio: '2026-03-10', fechaFin: '2026-07-04', estado: 'activa' },
  { id: 2, curso: 'Hermenéutica Avanzada', periodo: '2026-1', fechaInicio: '2026-03-10', fechaFin: '2026-07-04', estado: 'activa' },
  { id: 3, curso: 'Griego Bíblico', periodo: '2025-2', fechaInicio: '2025-08-11', fechaFin: '2025-12-12', estado: 'cerrada' },
])

const form = ref({ curso: '', periodo: '', fechaInicio: '', fechaFin: '', estado: 'activa' })

function abrirDialogo(instancia = null) {
  editando.value = instancia
  form.value = instancia
    ? { ...instancia }
    : { curso: '', periodo: '', fechaInicio: '', fechaFin: '', estado: 'activa' }
  dialogo.value = true
}

function guardar() {
  if (editando.value) {
    Object.assign(editando.value, form.value)
    $q.notify({ type: 'positive', message: 'Instancia actualizada.' })
  } else {
    instancias.value.push({ id: Date.now(), ...form.value })
    $q.notify({ type: 'positive', message: 'Instancia creada.' })
  }
  dialogo.value = false
}

function eliminar(instancia) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Eliminar la instancia de "${instancia.curso}" (${instancia.periodo})?`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(() => {
    instancias.value = instancias.value.filter(i => i.id !== instancia.id)
    $q.notify({ type: 'negative', message: 'Instancia eliminada.' })
  })
}
</script>