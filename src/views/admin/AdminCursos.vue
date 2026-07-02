<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h5 text-weight-bold" style="color: #0D1B3E;">Gestión de Cursos</div>
      <div class="row items-center q-gutter-md">
        <q-toggle
          v-model="mostrarInactivos"
          label="Mostrar inactivos"
          style="color: #555555; font-size: 13px;"
        />
        <div style="position: relative; display: inline-flex;">
          <q-btn
            unelevated icon="add" label="Nuevo curso"
            :style="isAdmin ? 'background: #0D1B3E; color: white; border-radius: 8px;' : 'background: #0D1B3E; color: white; border-radius: 8px; opacity: 0.4; pointer-events: none;'"
            @click="abrirDialogo()"
          />
          <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
            <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear</q-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- Spinner carga inicial -->
    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <!-- Sin cursos -->
    <div
      v-else-if="cursos.length === 0"
      class="column items-center q-mt-xl"
      style="color: #9E9E9E;"
    >
      <q-icon name="menu_book" size="48px" style="opacity: 0.4;" />
      <div class="q-mt-sm text-body1">No hay cursos registrados</div>
    </div>

    <!-- Grilla de cursos -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="curso in cursos" :key="curso.id" class="col-12 col-sm-6 col-lg-4">
        <q-card
          flat
          :style="curso.active === false
            ? 'background: #F5F5F5; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;'
            : 'background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden;'"
        >
          <q-card-section>
            <div class="row items-start justify-between no-wrap">
              <div style="flex: 1; min-width: 0;">
                <div class="row items-center q-gutter-xs q-mb-xs">
                  <span
                    class="text-subtitle1 text-weight-bold"
                    :style="curso.active === false ? 'color: #999999;' : 'color: #0D1B3E;'"
                  >{{ curso.name }}</span>
                  <q-badge
                    v-if="curso.active === false"
                    style="background: #E0E0E0; color: #757575; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px;"
                  >
                    Inactivo
                  </q-badge>
                </div>
                <div
                  v-if="curso.description"
                  class="text-body2"
                  :style="curso.active === false ? 'color: #BDBDBD; line-height: 1.5;' : 'color: #555555; line-height: 1.5;'"
                >
                  {{ curso.description }}
                </div>
              </div>
              <div class="row items-center q-ml-sm" style="flex-shrink: 0;">
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="curso-btn curso-btn-edit"
                    :style="!isAdmin ? 'opacity: 0.4; pointer-events: none;' : ''"
                    @click="abrirDialogo(curso)"
                  >
                    <i class="ti ti-pencil" style="font-size: 18px;" />
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
                  </div>
                </div>
                <div v-if="curso.active !== false" style="position: relative; display: inline-flex;">
                  <button
                    class="curso-btn curso-btn-deactivate"
                    :style="!isAdmin ? 'opacity: 0.4; pointer-events: none;' : ''"
                    @click="abrirDesactivar(curso)"
                  >
                    <i class="ti ti-eye-off" style="font-size: 18px;" />
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden desactivar</q-tooltip>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog crear/editar -->
    <q-dialog v-model="dialogo">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Curso' : 'Nuevo Curso' }}</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.name" label="Nombre del curso" />
          <q-input v-model="form.description" label="Descripción" type="textarea" autogrow />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" class="pdv-btn-save" :loading="guardando" @click="guardar" />
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialog confirmar desactivación -->
    <q-dialog v-model="dialogoDesactivar">
      <q-card class="pdv-dialog">
        <div class="pdv-dialog-title" style="color: #C0392B;">Desactivar curso</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Desactivar <strong>{{ cursoADesactivar?.name }}</strong>?
            El ramo dejará de aparecer en nuevas instancias pero su historial se conserva.
          </p>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated
            label="Desactivar"
            :loading="desactivando"
            style="background: #C0392B; color: white; border-radius: 6px; padding: 0 24px; font-weight: 600;"
            @click="confirmarDesactivar"
          />
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { usePermissions } from '../../composables/usePermissions'

const $q = useQuasar()
const { isAdmin } = usePermissions()
const cursos = ref([])
const cargando = ref(false)
const mostrarInactivos = ref(false)
const dialogo = ref(false)
const editando = ref(null)
const guardando = ref(false)
const dialogoDesactivar = ref(false)
const cursoADesactivar = ref(null)
const desactivando = ref(false)

const form = ref({ name: '', description: '' })

async function cargarCursos() {
  cargando.value = true
  try {
    const params = mostrarInactivos.value ? { includeInactive: true } : {}
    const { data } = await api.get('/courses', { params })
    cursos.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de cursos.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

onMounted(cargarCursos)
watch(mostrarInactivos, cargarCursos)

function abrirDialogo(curso = null) {
  editando.value = curso
  form.value = curso
    ? { name: curso.name, description: curso.description ?? '' }
    : { name: '', description: '' }
  dialogo.value = true
}

async function guardar() {
  guardando.value = true
  try {
    if (editando.value) {
      await api.patch(`/courses/${editando.value.id}`, form.value)
      $q.notify({ type: 'positive', message: 'Curso actualizado.', position: 'top' })
    } else {
      await api.post('/courses', form.value)
      $q.notify({ type: 'positive', message: 'Curso creado.', position: 'top' })
    }
    dialogo.value = false
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar el curso.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

function abrirDesactivar(curso) {
  cursoADesactivar.value = curso
  dialogoDesactivar.value = true
}

async function confirmarDesactivar() {
  desactivando.value = true
  try {
    await api.patch(`/courses/${cursoADesactivar.value.id}`, { active: false })
    dialogoDesactivar.value = false
    $q.notify({ type: 'positive', message: 'Curso desactivado.', position: 'top' })
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo desactivar el curso.', position: 'top' })
  } finally {
    desactivando.value = false
  }
}
</script>

<style scoped>
.curso-btn {
  background: none;
  border: none;
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #BDBDBD;
  transition: background 0.15s, color 0.15s;
  padding: 0;
}

.curso-btn-edit:hover {
  background: rgba(13, 27, 62, 0.08);
  color: #0D1B3E;
}

.curso-btn-deactivate:hover {
  background: rgba(192, 57, 43, 0.08);
  color: #C0392B;
}
</style>