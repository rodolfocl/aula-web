<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold text-primary">Gestión de Cursos</div>
      <q-btn color="primary" icon="add" label="Nuevo curso" unelevated @click="abrirDialogo()" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="curso in cursos" :key="curso.id" class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold">{{ curso.nombre }}</div>
            <div class="text-caption text-grey-6 q-mt-xs">
              <q-icon name="person" size="xs" /> {{ curso.profesor }}
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-chip dense color="secondary" text-color="white" icon="people">
              {{ curso.alumnos }} alumnos
            </q-chip>
            <q-chip dense color="grey-4" text-color="dark" icon="schedule">
              {{ curso.horas }}h
            </q-chip>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="primary" icon="edit" label="Editar" dense @click="abrirDialogo(curso)" />
            <q-btn flat color="negative" icon="delete" label="Eliminar" dense @click="eliminar(curso)" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialogo">
      <q-card style="min-width: 380px">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar Curso' : 'Nuevo Curso' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.nombre" label="Nombre del curso" outlined dense />
          <q-select v-model="form.profesor" label="Profesor" :options="profesores" outlined dense />
          <q-input v-model.number="form.horas" label="Horas totales" type="number" outlined dense />
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
    $q.notify({ type: 'positive', message: 'Curso actualizado.' })
  } else {
    cursos.value.push({ id: Date.now(), alumnos: 0, ...form.value })
    $q.notify({ type: 'positive', message: 'Curso creado.' })
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
    $q.notify({ type: 'negative', message: 'Curso eliminado.' })
  })
}
</script>