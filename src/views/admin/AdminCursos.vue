<template>
  <q-page class="q-pa-md" style="background: #F0F2F5; min-height: 100vh;">

    <CursosDrawer
      v-model="drawerAbierto"
      :plantilla="plantillaDrawer"
      :tab-inicial="tabDrawer"
      @actualizado="cargarCursos"
    />
    <div class="row items-start justify-between q-mb-md">
      <div>
        <div style="color: #0D1B3E; font-size: 20px; font-weight: 700;">Plantilla de Cursos</div>
        <div style="color: #64748B; font-size: 13.5px; margin-top: 4px; max-width: 560px; line-height: 1.5;">
          Define el catálogo de asignaturas disponibles: nombre, descripción y reglas generales.
          Para dictar una asignatura en un período concreto, usa el botón <strong>+</strong> en la tarjeta correspondiente.
        </div>
      </div>
      <div class="row items-center q-gutter-md">
        <q-toggle
          v-model="mostrarInactivos"
          label="Mostrar inactivos"
          style="color: #64748B; font-size: 13px;"
        />
        <div style="position: relative; display: inline-flex;">
          <q-btn
            unelevated no-caps
            class="pdv-btn-save"
            :style="!isAdmin ? 'opacity: 0.4; pointer-events: none;' : ''"
            @click="abrirDialogo()"
          >
            <i class="ti ti-plus" style="font-size: 16px; margin-right: 6px;" />
            Nueva plantilla
          </q-btn>
          <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
            <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear plantillas</q-tooltip>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cargando" class="row justify-center q-mt-xl">
      <q-spinner-dots color="primary" size="48px" />
    </div>

    <EmptyState v-else-if="cursos.length === 0" icon="📚" message="No hay plantillas registradas" />

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
                <div class="course-meta" style="margin-top: 10px;">

                  <!-- Máx. ausencias -->
                  <div class="course-meta-row">
                    <q-icon name="event_busy" size="14px" style="color: #94A3B8; flex-shrink: 0;" />
                    <span v-if="curso.default_max_absences != null">Máx. {{ curso.default_max_absences }} ausencias permitidas</span>
                    <span v-else style="color: #CBD5E1;">Sin límite definido</span>
                  </div>

                  <!-- Cursos activos -->
                  <div
                    class="course-meta-row course-meta-link"
                    @click="abrirDrawer(curso, 'activos')"
                  >
                    <q-icon
                      v-if="curso.active_instances_count > 0"
                      name="check_circle"
                      size="14px"
                      style="color: #2E7D32; flex-shrink: 0;"
                    />
                    <q-icon
                      v-else
                      name="radio_button_unchecked"
                      size="14px"
                      style="color: #CBD5E1; flex-shrink: 0;"
                    />
                    <span :style="curso.active_instances_count > 0 ? 'color: #2E7D32;' : ''">
                      {{ curso.active_instances_count > 0
                          ? `${curso.active_instances_count} curso${curso.active_instances_count > 1 ? 's' : ''} activo${curso.active_instances_count > 1 ? 's' : ''}`
                          : 'Sin cursos activos' }}
                    </span>
                  </div>

                  <!-- Cursos anteriores -->
                  <div
                    class="course-meta-row course-meta-link"
                    @click="abrirDrawer(curso, 'anteriores')"
                  >
                    <q-icon name="history_edu" size="14px" :style="curso.past_instances_count > 0 ? 'color: #1D68C8; flex-shrink: 0;' : 'color: #94A3B8; flex-shrink: 0;'" />
                    <span :style="curso.past_instances_count > 0 ? 'color: #1D68C8;' : ''">
                      {{ curso.past_instances_count > 0
                          ? `${curso.past_instances_count} curso${curso.past_instances_count > 1 ? 's' : ''} dictado${curso.past_instances_count > 1 ? 's' : ''} anteriormente`
                          : 'Sin cursos anteriores' }}
                    </span>
                  </div>

                </div>
              </div>
              <div class="row items-center" style="flex-shrink: 0; gap: 4px;">

                <!-- Editar plantilla -->
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn pdv-action-blue"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="abrirDialogo(curso)"
                  >
                    <i class="ti ti-pencil" style="font-size: 16px;" />
                    <q-tooltip v-if="isAdmin" class="pdv-tooltip">Editar plantilla</q-tooltip>
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden editar</q-tooltip>
                  </div>
                </div>

                <!-- Ocultar / Activar plantilla (toggle) -->
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn"
                    :class="[curso.active !== false ? 'pdv-action-danger' : 'pdv-action-success', { 'pdv-action-disabled': !isAdmin }]"
                    @click="curso.active !== false ? abrirDesactivar(curso) : activarCurso(curso)"
                  >
                    <i :class="curso.active !== false ? 'ti ti-eye-off' : 'ti ti-eye'" style="font-size: 16px;" />
                    <q-tooltip v-if="isAdmin" class="pdv-tooltip">
                      {{ curso.active !== false ? 'Ocultar plantilla' : 'Activar plantilla' }}
                    </q-tooltip>
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">
                      Solo los administradores pueden {{ curso.active !== false ? 'ocultar' : 'activar' }} plantillas
                    </q-tooltip>
                  </div>
                </div>

                <!-- Separador visual entre grupos -->
                <div style="width: 6px;" />

                <!-- + Crear curso -->
                <div style="position: relative; display: inline-flex;">
                  <button
                    class="pdv-action-btn"
                    :class="{ 'pdv-action-disabled': !isAdmin }"
                    @click="abrirNuevoCurso(curso)"
                  >
                    <i class="ti ti-plus" style="font-size: 16px;" />
                    <q-tooltip v-if="isAdmin" class="pdv-tooltip">Crear un curso a partir de esta plantilla</q-tooltip>
                  </button>
                  <div v-if="!isAdmin" style="position: absolute; inset: 0; cursor: not-allowed;">
                    <q-tooltip class="pdv-tooltip">Solo los administradores pueden crear cursos</q-tooltip>
                  </div>
                </div>

              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ── Dialog crear/editar plantilla ── -->
    <q-dialog v-model="dialogo" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title">{{ editando ? 'Editar Plantilla de Curso' : 'Nueva Plantilla de Curso' }}</div>
        <div class="pdv-dialog-body">
          <q-input v-model="form.name" label="Nombre" outlined dense />
          <q-input v-model="form.description" label="Descripción" type="textarea" autogrow outlined dense />
          <q-input
            v-model.number="form.default_max_absences"
            label="Máx. ausencias permitidas (por defecto)"
            type="number"
            outlined dense
            hint="Valor sugerido al crear un curso a partir de esta plantilla"
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn unelevated label="Guardar" class="pdv-btn-save" :loading="guardando" @click="guardar" />
        </div>
      </q-card>
    </q-dialog>

    <!-- ── Dialog confirmar desactivación ── -->
    <q-dialog v-model="dialogoDesactivar" :maximized="$q.screen.lt.sm">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title" style="color: #991B1B;">Desactivar plantilla</div>
        <div class="pdv-dialog-body">
          <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.5;">
            ¿Desactivar <strong>{{ cursoADesactivar?.name }}</strong>?
            La plantilla dejará de aparecer para nuevos cursos pero su historial se conserva.
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

    <!-- ── Dialog crear nuevo Curso (instancia) desde plantilla ── -->
    <q-dialog v-model="dialogoNuevoCurso" :maximized="$q.screen.lt.sm" @hide="resetFormInstancia">
      <q-card class="pdv-dialog" :style="$q.screen.lt.sm ? 'border-radius: 0 !important; min-width: 100%;' : ''">
        <div class="pdv-dialog-title">Nuevo Curso</div>
        <div class="pdv-dialog-body">

          <!-- Plantilla fijada (no editable) -->
          <q-input
            :model-value="plantillaActual?.name"
            label="Plantilla de Curso"
            readonly
            outlined dense
            bg-color="grey-1"
          />

          <q-select
            v-model="formInstancia.teacher_id"
            label="Profesor"
            :options="opcionesProfesores"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined dense options-dense
            :loading="cargandoProfesores"
          />

          <div class="row q-gutter-md">
            <q-input
              v-model.number="formInstancia.year"
              label="Año"
              type="number"
              outlined dense
              style="flex: 1;"
            />
            <q-select
              v-model="formInstancia.period"
              label="Período"
              :options="PERIODOS"
              outlined dense options-dense
              style="flex: 1;"
            />
          </div>

          <div class="row q-gutter-md">
            <q-select
              v-model="formInstancia.day_of_week"
              label="Día"
              :options="DIAS"
              clearable
              outlined dense options-dense
              style="flex: 1;"
            />
            <q-input
              v-model="formInstancia.schedule_time"
              label="Hora"
              type="time"
              outlined dense
              style="flex: 1;"
            />
          </div>

          <AppDateField v-model="formInstancia.start_date" label="Fecha inicio" />
          <AppDateField v-model="formInstancia.end_date" label="Fecha fin" />
          <q-input
            v-model.number="formInstancia.max_absences"
            label="Máx. ausencias permitidas"
            type="number"
            outlined dense
            hint="Precargado desde la plantilla, puede modificarse para este curso"
          />
        </div>
        <div class="pdv-dialog-actions">
          <q-btn flat label="Cancelar" v-close-popup class="pdv-btn-cancel" />
          <q-btn
            unelevated label="Guardar"
            class="pdv-btn-save"
            :loading="guardandoInstancia"
            @click="guardarInstancia"
          />
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import api from '../../services/api'
import { usePermissions } from '../../composables/usePermissions'
import EmptyState from '../../components/EmptyState.vue'
import CursosDrawer from '../../components/CursosDrawer.vue'
import AppDateField from '../../components/AppDateField.vue'

const $q = useQuasar()
const { isAdmin } = usePermissions()

// ── Estado: drawer de instancias ─────────────────────────────
const drawerAbierto   = ref(false)
const plantillaDrawer = ref(null)
const tabDrawer       = ref('activos')

function abrirDrawer(curso, tab) {
  plantillaDrawer.value = curso
  tabDrawer.value = tab
  drawerAbierto.value = true
}

// ── Estado: plantillas (courses) ──────────────────────────────
const cursos = ref([])
const cargando = ref(false)
const mostrarInactivos = ref(false)
const dialogo = ref(false)
const editando = ref(null)
const guardando = ref(false)
const dialogoDesactivar = ref(false)
const cursoADesactivar = ref(null)
const desactivando = ref(false)

const form = ref({ name: '', description: '', default_max_absences: null })

// ── Estado: crear curso (instancia) desde plantilla ───────────
const PERIODOS = ['Anual', 'Primer semestre', 'Segundo semestre', 'Seminario']
const DIAS = ['Lunes', 'Martes', 'Miércoles']

const dialogoNuevoCurso = ref(false)
const plantillaActual = ref(null)
const profesores = ref([])
const cargandoProfesores = ref(false)
const guardandoInstancia = ref(false)

const formInstanciaVacio = () => ({
  teacher_id: null,
  year: new Date().getFullYear(),
  period: '',
  day_of_week: null,
  schedule_time: '',
  start_date: '',
  end_date: '',
  max_absences: null,
})
const formInstancia = ref(formInstanciaVacio())

const opcionesProfesores = computed(() =>
  profesores.value.map(u => ({ label: u.full_name, value: u.id }))
)

// ── Carga de plantillas ───────────────────────────────────────
async function cargarCursos() {
  cargando.value = true
  try {
    const params = mostrarInactivos.value ? { includeInactive: true } : {}
    const { data } = await api.get('/course-templates', { params })
    cursos.value = data
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de plantillas.', position: 'top' })
  } finally {
    cargando.value = false
  }
}

onMounted(cargarCursos)
watch(mostrarInactivos, cargarCursos)

// ── CRUD: plantillas ──────────────────────────────────────────
function abrirDialogo(curso = null) {
  editando.value = curso
  form.value = curso
    ? {
        name: curso.name,
        description: curso.description ?? '',
        default_max_absences: curso.default_max_absences ?? null,
      }
    : { name: '', description: '', default_max_absences: null }
  dialogo.value = true
}

async function guardar() {
  guardando.value = true
  try {
    if (editando.value) {
      await api.patch(`/course-templates/${editando.value.id}`, form.value)
      $q.notify({ type: 'positive', message: 'Plantilla actualizada.', position: 'top' })
    } else {
      await api.post('/course-templates', form.value)
      $q.notify({ type: 'positive', message: 'Plantilla creada.', position: 'top' })
    }
    dialogo.value = false
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo guardar la plantilla.', position: 'top' })
  } finally {
    guardando.value = false
  }
}

function abrirDesactivar(curso) {
  cursoADesactivar.value = curso
  dialogoDesactivar.value = true
}

async function activarCurso(curso) {
  try {
    await api.patch(`/course-templates/${curso.id}`, { active: true })
    $q.notify({ type: 'positive', message: 'Plantilla activada.', position: 'top' })
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo activar la plantilla.', position: 'top' })
  }
}

async function confirmarDesactivar() {
  desactivando.value = true
  try {
    await api.patch(`/course-templates/${cursoADesactivar.value.id}`, { active: false })
    dialogoDesactivar.value = false
    $q.notify({ type: 'positive', message: 'Plantilla desactivada.', position: 'top' })
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo desactivar la plantilla.', position: 'top' })
  } finally {
    desactivando.value = false
  }
}

// ── Crear curso (instancia) desde plantilla ───────────────────
async function abrirNuevoCurso(plantilla) {
  plantillaActual.value = plantilla
  formInstancia.value = {
    ...formInstanciaVacio(),
    max_absences: plantilla.default_max_absences,
  }

  if (profesores.value.length === 0) {
    cargandoProfesores.value = true
    try {
      const { data } = await api.get('/users')
      profesores.value = data.filter(u => Array.isArray(u.roles) && u.roles.includes('profesor'))
    } catch {
      $q.notify({ type: 'negative', message: 'No se pudo cargar la lista de profesores.', position: 'top' })
      cargandoProfesores.value = false
      return
    } finally {
      cargandoProfesores.value = false
    }
  }

  dialogoNuevoCurso.value = true
}

function resetFormInstancia() {
  formInstancia.value = formInstanciaVacio()
  plantillaActual.value = null
}

async function guardarInstancia() {
  guardandoInstancia.value = true
  try {
    const payload = {
      template_id: plantillaActual.value.id,
      ...formInstancia.value,
      start_date: formInstancia.value.start_date || null,
      end_date: formInstancia.value.end_date || null,
    }
    await api.post('/courses', payload)
    $q.notify({ type: 'positive', message: 'Curso creado.', position: 'top' })
    dialogoNuevoCurso.value = false
    await cargarCursos()
  } catch {
    $q.notify({ type: 'negative', message: 'No se pudo crear el curso.', position: 'top' })
  } finally {
    guardandoInstancia.value = false
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

.course-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.course-meta-row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.3;
}

.course-meta-link {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 3px;
  margin: 0 -3px;
  transition: background 0.15s;
}

.course-meta-link:hover {
  background: #F1F5F9;
}

</style>
