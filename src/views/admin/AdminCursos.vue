<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">
    <div class="row items-center justify-between q-mb-md">
      <div style="color: #0D1B3E; font-size: 20px; font-weight: 700;">Gestión de Cursos</div>
      <div class="row items-center q-gutter-md">
        <q-toggle
          v-model="mostrarInactivos"
          label="Mostrar inactivos"
          style="color: #64748B; font-size: 13px;"
        />
        <div style="position: relative; display: inline-flex;">
          <q-btn
            unelevated icon="add" label="Nuevo curso"
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
    </div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="cursos.length === 0" icon="📚" message="No hay cursos registrados" />

    <div v-else class="row q-col-gutter-md items-stretch">
      <div v-for="curso in cursos" :key="curso.id" class="col-12 col-sm-6 col-lg-4" style="display: flex;">
        <q-card
          flat
          class="course-card"
          :style="curso.active === false
            ? 'background: #F8FAFC;'
            : 'background: white;'"
        >
          <q-card-section style="height: 100%; padding: 18px 20px;">
            <div class="row items-start justify-between no-wrap" style="height: 100%; gap: 12px;">
              <div style="flex: 1; min-width: 0;">
                <div class="row items-center q-gutter-xs q-mb-xs">
                  <span
                    class="text-subtitle1 text-weight-bold"
                    :style="curso.active === false ? 'color: #94A3B8;' : 'color: #0D1B3E;'"
                  >{{ curso.name }}</span>
                  <span
                    v-if="curso.active === false"
                    class="pdv-pill pdv-pill-neutral"
                    style="font-size: 10px;"
                  >Inactivo</span>
                </div>
                <div
                  v-if="curso.description"
                  class="text-body2 course-description"
                  :style="curso.active === false ? 'color: #CBD5E1;' : 'color: #64748B;'"
                >
                  {{ curso.description }}
                </div>
              </div>
              <div class="row items-center" style="flex-shrink: 0; gap: 6px;">
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn pdv-action-blue"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="abrirDialogo(curso)"
                  >
                    <i class="ti ti-pencil" style="font-size: 16px;" />
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
                  </div>
                </div>
                <div v-if="curso.active !== false" style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn pdv-action-danger"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="abrirDesactivar(curso)"
                  >
                    <i class="ti ti-eye-off" style="font-size: 16px;" />
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
    <q-dialog v-model="dialogo" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
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
    <q-dialog v-model="dialogoDesactivar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Desactivar curso</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Desactivar <strong>{{ cursoADesactivar?.name }}</strong>?
            El ramo dejará de aparecer en nuevas instancias pero su historial se conserva.
          </p>
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Desactivar" :loading="desactivando"
            style="background: #991B1B; color: white; border-radius: 8px; padding: 0 24px; font-weight: 600;"
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
import EmptyState from '../../components/EmptyState.vue'

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
.course-card {
  width: 100%;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  border-radius: 14px !important;
  box-shadow: var(--pdv-shadow-card) !important;
  border: none !important;
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.15s;
}

.course-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06) !important;
  transform: translateY(-1px);
}

.course-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}
</style>
