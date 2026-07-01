<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Cursos</div>
      <q-btn
        unelevated
        icon="add"
        label="Nuevo curso"
        style="background: #0D1B3E; color: white; border-radius: 8px;"
        @click="abrirDialogo()"
      />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="curso in cursos" :key="curso.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat style="background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;">
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold" style="color: #0D1B3E;">{{ curso.nombre }}</div>
            <div class="text-caption q-mt-xs" style="color: #8B7355;">
              <q-icon name="person" size="xs" /> {{ curso.profesor }}
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-chip dense icon="people" style="background: rgba(13,27,62,0.08); color: #0D1B3E; font-size: 12px;">
              {{ curso.alumnos }} alumnos
            </q-chip>
            <q-chip dense icon="schedule" style="background: rgba(201,169,110,0.2); color: #7A5C1E; font-size: 12px;">
              {{ curso.horas }}h
            </q-chip>
          </q-card-section>
          <q-card-actions>
            <q-btn flat dense icon="edit" label="Editar" style="color: #0D1B3E;" @click="abrirDialogo(curso)" />
            <q-btn flat dense icon="delete" label="Eliminar" color="negative" @click="eliminar(curso)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialogo">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Curso' : 'Nuevo Curso' }}</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.nombre" label="Nombre del curso" />
          <q-select v-model="form.profesor" label="Profesor" :options="profesores" />
          <q-input v-model.number="form.horas" label="Horas totales" type="number" />
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

const profesores = ['Carlos Muñoz', 'Pedro Soto', 'Luis Vera']

const cursos = ref([
  { id: 1, nombre: 'Teología Bíblica II', profesor: 'Carlos Muñoz', alumnos: 12, horas: 40 },
  { id: 2, nombre: 'Hermenéutica Avanzada', profesor: 'Pedro Soto', alumnos: 8, horas: 32 },
  { id: 3, nombre: 'Griego Bíblico', profesor: 'Luis Vera', alumnos: 6, horas: 48 },
  { id: 4, nombre: 'Homilética I', profesor: 'Pedro Soto', alumnos: 15, horas: 36 },
])

const form = ref({ nombre: '', profesor: '', horas: 0 })

function abrirDialogo(curso = null) {
  editando.value = curso
  form.value = curso
    ? { nombre: curso.nombre, profesor: curso.profesor, horas: curso.horas }
    : { nombre: '', profesor: '', horas: 0 }
  dialogo.value = true
}

function guardar() {
  if (editando.value) {
    Object.assign(editando.value, form.value)
    $q.notify({ type: 'positive', message: 'Curso actualizado.', position: 'top' })
  } else {
    cursos.value.push({ id: Date.now(), alumnos: 0, ...form.value })
    $q.notify({ type: 'positive', message: 'Curso creado.', position: 'top' })
  }
  dialogo.value = false
}

function eliminar(curso) {
  $q.dialog({
    title: 'Confirmar',
    message: `¿Eliminar el curso "${curso.nombre}"?`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { label: 'Cancelar', flat: true },
  }).onOk(() => {
    cursos.value = cursos.value.filter(c => c.id !== curso.id)
    $q.notify({ type: 'negative', message: 'Curso eliminado.', position: 'top' })
  })
}
</script>