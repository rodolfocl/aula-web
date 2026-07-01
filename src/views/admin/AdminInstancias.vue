<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Instancias</div>
      <q-btn
        unelevated
        icon="add"
        label="Nueva instancia"
        style="background: #0D1B3E; color: white; border-radius: 8px;"
        @click="abrirDialogo()"
      />
    </div>

    <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
      <q-table
        :rows="instancias"
        :columns="columnas"
        row-key="id"
        flat
        no-data-label="No hay instancias registradas"
      >
        <template #body-cell-estado="props">
          <q-td :props="props">
            <q-badge
              :style="props.value === 'activa'
                ? 'background: #E8F5E9; color: #1B5E20; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'
                : 'background: #F5F5F5; color: #616161; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;'"
            >
              {{ props.value }}
            </q-badge>
          </q-td>
        </template>
        <template #body-cell-acciones="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn flat round dense icon="edit" size="sm" style="color: #0D1B3E;" @click="abrirDialogo(props.row)" />
            <q-btn flat round dense icon="delete" color="negative" size="sm" @click="eliminar(props.row)" />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogo">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Instancia' : 'Nueva Instancia' }}</div>
        <div class="pdv-dialog-body">
          <q-select v-model="form.curso" label="Curso" :options="nombresCursos" />
          <q-input v-model="form.periodo" label="Período (ej: 2026-1)" />
          <q-input v-model="form.fechaInicio" label="Fecha inicio" type="date" />
          <q-input v-model="form.fechaFin" label="Fecha fin" type="date" />
          <q-select v-model="form.estado" label="Estado" :options="['activa', 'cerrada']" />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" class="pdv-btn-save" @click="guardar" />
        </div>
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
    $q.notify({ type: 'positive', message: 'Instancia actualizada.', position: 'top' })
  } else {
    instancias.value.push({ id: Date.now(), ...form.value })
    $q.notify({ type: 'positive', message: 'Instancia creada.', position: 'top' })
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
    $q.notify({ type: 'negative', message: 'Instancia eliminada.', position: 'top' })
  })
}
</script>